/**
 * Конфигурация источников API
 * @module api/sources/config
 */

/**
 * Ключ для хранения выбранного источника API в localStorage
 * @type {string}
 */
export const STORAGE_KEY = 'api-quest-source';

/**
 * Определяем текущий хост
 */
const CURRENT_HOST = window.location.protocol + '//' + window.location.host;

/**
 * Конфигурация источников API
 * @type {Object}
 */
export const apiSourceConfig = {
    /**
     * Мок-источник (симулятор)
     */
    mock: {
        name: 'Симулятор API',
        description: 'Локальный симулятор API для отработки запросов без внешних сервисов',
        baseUrl: '',
        needsAuth: false,
        // Для режима разработки делаем мок всегда доступным
        alwaysAvailable: true
    },
    
    /**
     * Публичный API
     */
    public: {
        name: 'Публичный API',
        description: 'Публичный учебный API с ограниченным функционалом',
        // В режиме разработки указываем тот же хост
        baseUrl: CURRENT_HOST + '/api',
        needsAuth: false,
        // Для режима разработки делаем публичный API недоступным 
        // (не отправляем реальные запросы)
        alwaysAvailable: false
    },
    
    /**
     * Собственное учебное API
     */
    custom: {
        name: 'Учебное API',
        description: 'Учебное API с полным функционалом и авторизацией',
        // В режиме разработки указываем тот же хост
        baseUrl: CURRENT_HOST + '/api',
        needsAuth: true,
        // Для режима разработки делаем учебное API недоступным
        // (не отправляем реальные запросы)
        alwaysAvailable: false
    }
};

/**
 * Начальное состояние источников API
 * @type {Object}
 */
export const defaultSourceState = {
    mock: {
        isAvailable: true,    // Мок всегда доступен
        priority: 3           // Низкий приоритет
    },
    public: {
        isAvailable: false,   // Изначально считаем недоступным
        priority: 2           // Средний приоритет
    },
    custom: {
        isAvailable: false,   // Изначально считаем недоступным
        priority: 1           // Высокий приоритет
    }
};