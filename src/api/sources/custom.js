/**
 * Адаптер для учебного API
 * @module api/sources/custom
 */

import { apiSourceConfig } from './config.js';
import { logRequest } from '../monitoring/logger.js';

/**
 * Обработка запроса для адаптера учебного API
 * @param {Object} request - Объект запроса
 * @returns {Object} Обработанный запрос
 */
export function processRequest(request) {
    // Копируем запрос для модификации
    const processedRequest = JSON.parse(JSON.stringify(request));
    
    // Преобразуем URL для собственного API
    if (!processedRequest.url.startsWith('http')) {
        processedRequest.url = apiSourceConfig.custom.baseUrl + processedRequest.url;
    }
    
    // Добавляем заголовки авторизации для собственного API
    processedRequest.headers['X-API-Quest-Auth'] = sessionStorage.getItem('apiQuestAuthToken') || '';
    
    return processedRequest;
}

/**
 * Обработка ответа от учебного API
 * @param {Object} response - Объект ответа
 * @returns {Object} Стандартизированный ответ
 */
export function processResponse(response) {
    // Стандартизация ответа от собственного API
    const processedResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.data
    };
    
    // Если в ответе есть токен авторизации, сохраняем его
    if (response.headers['x-api-quest-auth-token']) {
        sessionStorage.setItem('apiQuestAuthToken', response.headers['x-api-quest-auth-token']);
    }
    
    return processedResponse;
}

/**
 * Отправка запроса через адаптер учебного API
 * @param {Object} request - Объект запроса
 * @returns {Promise<Object>} Промис с ответом
 */
export async function sendRequest(request) {
    // Преобразуем запрос для собственного API
    const processedRequest = processRequest(request);
    
    // Логируем запрос
    logRequest(processedRequest, 'custom');
    
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
        // В случае ошибки возвращаем специальный ответ
        return {
            status: 500,
            statusText: 'Error',
            headers: {'Content-Type': 'application/json'},
            body: {
                error: 'Ошибка при обращении к учебному API',
                message: error.message,
                source: 'custom'
            }
        };
    }
}