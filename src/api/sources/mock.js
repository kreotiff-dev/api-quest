/**
 * Адаптер для мок-данных API
 * @module api/sources/mock
 */

import { apiResponses } from '../../data/responses.js';
import { logRequest } from '../monitoring/logger.js';

/**
 * Обработка запроса для мок-адаптера
 * @param {Object} request - Объект запроса
 * @returns {Object} Обработанный запрос
 */
export function processRequest(request) {
    // Для моков просто возвращаем исходный запрос
    return request;
}

/**
 * Обработка ответа для мок-адаптера
 * @param {Object} response - Объект ответа
 * @returns {Object} Обработанный ответ
 */
export function processResponse(response) {
    // Для моков просто возвращаем исходный ответ
    return response;
}

/**
 * Отправка запроса через мок-адаптер
 * @param {Object} request - Объект запроса
 * @returns {Promise<Object>} Промис с ответом
 */
export async function sendRequest(request) {
    // Имитация задержки сети
    return new Promise((resolve) => {
        // Логируем детали обработки запроса
        logRequest(request, 'mock');
        
        setTimeout(() => {
            // Создаем ключ запроса для поиска в моках
            let requestKey = `${request.method}:${request.url}`;
            
            // Для запросов к защищенным ресурсам добавляем API-ключ
            if (request.url.includes('/api/secure-data') && request.headers['X-API-Key']) {
                requestKey += `/${request.headers['X-API-Key']}`;
            }
            
            // Специальная обработка для запросов с пустым телом
            if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
                (!request.body || Object.keys(request.body).length === 0)) {
                requestKey += '/empty';
            }
            
            // Проверяем наличие мока для данного запроса
            if (apiResponses[requestKey]) {
                let response = JSON.parse(JSON.stringify(apiResponses[requestKey]));
                
                // Для POST/PUT запросов подставляем данные из тела запроса
                if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
                    request.body && response.body) {
                    
                    // Заменяем плейсхолдеры на значения из запроса
                    if (typeof response.body === 'object') {
                        for (const key in response.body) {
                            if (typeof response.body[key] === 'string' && 
                                response.body[key].startsWith('{') && 
                                response.body[key].endsWith('}')) {
                                
                                const placeholder = response.body[key].substring(1, response.body[key].length - 1);
                                
                                if (placeholder === 'currentDate') {
                                    response.body[key] = new Date().toISOString();
                                } else if (request.body[placeholder] !== undefined) {
                                    response.body[key] = request.body[placeholder];
                                }
                            }
                        }
                    }
                }
                
                resolve(response);
            } else {
                // Если мок не найден, возвращаем ошибку 404
                resolve({
                    status: 404,
                    statusText: 'Not Found',
                    headers: {
                        'Content-Type': 'application/json',
                        'Server': 'API Simulator'
                    },
                    body: {
                        error: 'Not Found',
                        message: 'Запрашиваемый ресурс не найден',
                        requestKey: requestKey
                    }
                });
            }
        }, 800); // Эмуляция задержки сети
    });
}