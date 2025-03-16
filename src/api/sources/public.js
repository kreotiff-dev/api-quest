/**
 * Адаптер для публичных API
 * @module api/sources/public
 */

import { apiSourceConfig } from './config.js';
import { logRequest } from '../monitoring/logger.js';

/**
 * Обработка запроса для адаптера публичных API
 * @param {Object} request - Объект запроса
 * @returns {Object} Обработанный запрос
 */
export function processRequest(request) {
    // Копируем запрос для модификации
    const processedRequest = JSON.parse(JSON.stringify(request));
    
    // Преобразуем URL для публичных API
    if (!processedRequest.url.startsWith('http')) {
        processedRequest.url = apiSourceConfig.public.baseUrl + processedRequest.url;
    }
    
    // Добавляем заголовок для идентификации платформы
    processedRequest.headers['X-API-Quest-Client'] = 'Public';
    
    return processedRequest;
}

/**
 * Обработка ответа от публичного API
 * @param {Object} response - Объект ответа
 * @returns {Object} Стандартизированный ответ
 */
export function processResponse(response) {
    // Стандартизация ответа от публичного API
    const processedResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.data
    };
    
    return processedResponse;
}

/**
 * Отправка запроса через адаптер публичных API
 * @param {Object} request - Объект запроса
 * @returns {Promise<Object>} Промис с ответом
 */
export async function sendRequest(request) {
    // Преобразуем запрос для публичного API
    const processedRequest = processRequest(request);
    
    // Логируем обработку запроса
    logRequest(processedRequest, 'public');
    
    try {
        // Отправляем запрос через Fetch API
        const response = await fetch(processedRequest.url, {
            method: processedRequest.method,
            headers: processedRequest.headers,
            body: processedRequest.body ? JSON.stringify(processedRequest.body) : undefined
        });
        
        // Получаем данные ответа
        const data = await response.json();
        
        // Формируем объект ответа
        const responseObj = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: data
        };
        
        return processResponse(responseObj);
    } catch (error) {
        // Логируем ошибку
        console.error('Ошибка в public адаптере:', error.message);
        
        // В случае ошибки возвращаем специальный ответ
        return {
            status: 500,
            statusText: 'Error',
            headers: {'Content-Type': 'application/json'},
            body: {
                error: 'Ошибка при обращении к публичному API',
                message: error.message,
                source: 'public'
            }
        };
    }
}