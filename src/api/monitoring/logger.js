/**
 * Модуль логирования HTTP-запросов
 * @module api/monitoring/logger
 */

import { emit } from '../../core/events.js';

// Приватные переменные
// Максимальное количество хранимых логов
const MAX_LOGS = 100;

// Массив для хранения логов
let logs = [];

// Флаг активности логирования
let loggingEnabled = true;

// Ключ для хранения логов в localStorage
const STORAGE_KEY = 'apiQuestHttpLogs';

/**
 * Типы логов
 * @enum {string}
 */
export const LOG_TYPES = {
    REQUEST: 'request',
    RESPONSE: 'response',
    ERROR: 'error'
};

/**
 * Загрузка сохраненных логов из localStorage
 * @private
 */
function loadLogs() {
    try {
        const savedLogs = localStorage.getItem(STORAGE_KEY);
        if (savedLogs) {
            logs = JSON.parse(savedLogs);
        }
    } catch (e) {
        console.error('Ошибка при загрузке логов HTTP:', e);
        logs = [];
    }
}

/**
 * Сохранение логов в localStorage
 * @private
 */
function saveLogs() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error('Ошибка при сохранении логов HTTP:', e);
    }
}

/**
 * Добавление нового лога
 * @param {string} type - Тип лога (request, response, error)
 * @param {Object} data - Данные лога
 * @param {string} source - Источник (mock, public, custom)
 * @returns {Object|null} Созданный лог или null, если логирование отключено
 * @private
 */
function addLog(type, data, source) {
    if (!loggingEnabled) return null;
    
    // Создаем запись лога
    const log = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        type,
        data,
        source: source || 'unknown'
    };
    
    // Добавляем в начало массива (новые логи вверху)
    logs.unshift(log);
    
    // Ограничиваем количество логов
    if (logs.length > MAX_LOGS) {
        logs = logs.slice(0, MAX_LOGS);
    }
    
    // Сохраняем в localStorage
    saveLogs();
    
    // Генерируем событие добавления лога
    emit('httpLogAdded', log);
    
    return log;
}

/**
 * Логирование HTTP-запроса
 * @param {Object} request - Объект запроса
 * @param {string} source - Источник API
 * @returns {Object|null} Созданный лог или null
 */
export function logRequest(request, source) {
    return addLog(LOG_TYPES.REQUEST, {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body
    }, source);
}

/**
 * Логирование HTTP-ответа
 * @param {Object} response - Объект ответа
 * @param {string} requestId - ID запроса
 * @param {string} source - Источник API
 * @returns {Object|null} Созданный лог или null
 */
export function logResponse(response, requestId, source) {
    return addLog(LOG_TYPES.RESPONSE, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.body,
        requestId
    }, source);
}

/**
 * Логирование ошибки HTTP
 * @param {Error} error - Объект ошибки
 * @param {string} requestId - ID запроса
 * @param {string} source - Источник API
 * @returns {Object|null} Созданный лог или null
 */
export function logError(error, requestId, source) {
    return addLog(LOG_TYPES.ERROR, {
        message: error.message,
        stack: error.stack,
        requestId
    }, source);
}

/**
 * Очистка всех логов
 */
export function clearLogs() {
    logs = [];
    saveLogs();
    emit('httpLogsCleared');
}

/**
 * Включение/выключение логирования
 * @param {boolean} [enabled] - Включить или выключить
 * @returns {boolean} Текущее состояние
 */
export function toggleLogging(enabled) {
    loggingEnabled = enabled !== undefined ? enabled : !loggingEnabled;
    emit('httpLoggingToggled', loggingEnabled);
    return loggingEnabled;
}

/**
 * Получение всех логов
 * @returns {Array} Копия массива логов
 */
export function getLogs() {
    return [...logs]; // Возвращаем копию массива
}

/**
 * Фильтрация логов
 * @param {Object} filters - Объект с фильтрами
 * @param {string} [filters.type] - Тип лога
 * @param {string} [filters.source] - Источник API
 * @param {string} [filters.method] - HTTP метод
 * @param {number} [filters.status] - HTTP статус
 * @param {string} [filters.search] - Строка поиска
 * @returns {Array} Отфильтрованные логи
 */
export function filterLogs(filters) {
    let filteredLogs = [...logs];
    
    if (filters) {
        if (filters.type) {
            filteredLogs = filteredLogs.filter(log => log.type === filters.type);
        }
        
        if (filters.source) {
            filteredLogs = filteredLogs.filter(log => log.source === filters.source);
        }
        
        if (filters.method) {
            filteredLogs = filteredLogs.filter(log => 
                log.type === LOG_TYPES.REQUEST && 
                log.data.method === filters.method
            );
        }
        
        if (filters.status) {
            filteredLogs = filteredLogs.filter(log => 
                log.type === LOG_TYPES.RESPONSE && 
                log.data.status === filters.status
            );
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredLogs = filteredLogs.filter(log => {
                // Поиск в URL
                if (log.type === LOG_TYPES.REQUEST && 
                    log.data.url.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Поиск в теле
                const body = log.data.body ? JSON.stringify(log.data.body).toLowerCase() : '';
                if (body.includes(searchTerm)) {
                    return true;
                }
                
                return false;
            });
        }
    }
    
    return filteredLogs;
}

/**
 * Получение статистики по запросам
 * @returns {Object} Объект со статистикой
 */
export function getRequestsStats() {
    // Фильтруем только запросы
    const requestLogs = logs.filter(log => log.type === LOG_TYPES.REQUEST);
    
    // Группируем по источникам
    const statsBySource = {};
    
    requestLogs.forEach(log => {
        const source = log.source || 'unknown';
        
        if (!statsBySource[source]) {
            statsBySource[source] = {
                total: 0,
                byMethod: {}
            };
        }
        
        statsBySource[source].total++;
        
        const method = log.data.method;
        if (!statsBySource[source].byMethod[method]) {
            statsBySource[source].byMethod[method] = 0;
        }
        
        statsBySource[source].byMethod[method]++;
    });
    
    return {
        total: requestLogs.length,
        bySource: statsBySource
    };
}

/**
 * Инициализация модуля
 */
export function init() {
    // Загружаем сохраненные логи
    loadLogs();
}