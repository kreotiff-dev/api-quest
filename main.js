/**
 * Точка входа в приложение API-Quest
 * Ответствен за импорт и инициализацию всех модулей
 */

// Импорт необходимых модулей
import { initConfig } from './src/core/config.js';
import { init as initApp } from './src/app.js';

/**
 * Инициализация приложения
 */
async function initializeApp() {
    try {
        // Инициализация конфигурации
        const config = initConfig();
        console.log(`API-Quest v${config.version} инициализируется в режиме ${config.mode}...`);
        
        // Инициализация основного модуля приложения
        await initApp();
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
    }
}

// Запуск инициализации при загрузке DOM
document.addEventListener('DOMContentLoaded', initializeApp);