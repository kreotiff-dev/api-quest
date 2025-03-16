/**
 * Главный модуль приложения API-Quest
 * @module app
 */

// Импорт модулей API
import * as apiSources from './api/sources/index.js';
import * as apiClient from './api/client/index.js';
import * as logger from './api/monitoring/logger.js';
import * as loggerUI from './api/monitoring/logger-ui.js';
import * as indicator from './api/monitoring/indicator.js';

// Импорт модулей UI
import * as ui from './ui/index.js';

// Импорт модулей ядра
import * as events from './core/events.js';
import * as config from './core/config.js';
import * as tasks from './core/tasks.js';
import * as taskList from './core/task-list.js';

// Переменные состояния приложения
let currentTask = null;
let currentScreen = 'tasks';

/**
 * Получение текущего задания
 * @returns {Object|null} Текущее задание или null
 */
export function getCurrentTask() {
    return currentTask;
}

/**
 * Установка текущего задания
 * @param {Object} task - Задание
 */
export function setCurrentTask(task) {
    currentTask = task;
    events.emit('currentTaskChanged', task);
}

/**
 * Получение текущего экрана
 * @returns {string} Имя текущего экрана
 */
export function getCurrentScreen() {
    return currentScreen;
}

/**
 * Переключение текущего экрана
 * @param {string} screen - Имя экрана
 */
export function setCurrentScreen(screen) {
    currentScreen = screen;
    events.emit('screenChanged', screen);
}

/**
 * Определение режима работы приложения
 * @returns {string} Режим работы (development, staging, production)
 */
export function getAppMode() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'development';
    } else if (location.hostname.includes('staging') || location.hostname.includes('test')) {
        return 'staging';
    } else {
        return 'production';
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Кнопка открытия документации API
    document.getElementById('open-api-docs')?.addEventListener('click', ui.openApiDocs);
    
    // Кнопка возврата к списку заданий
    document.getElementById('back-to-tasks')?.addEventListener('click', () => {
        ui.switchScreen('tasks');
    });
    
    // Обработчик отправки запроса
    document.getElementById('send-request')?.addEventListener('click', apiClient.sendApiRequest);
    
    // Кнопка проверки задания
    document.getElementById('check-solution')?.addEventListener('click', tasks.checkTaskCompletion);
    
    // Кнопка запроса подсказки
    document.getElementById('open-hints')?.addEventListener('click', tasks.getHint);
    
    // Добавление нового заголовка в запрос
    document.getElementById('add-header')?.addEventListener('click', () => {
        apiClient.addHeaderRow();
    });
    
    // Переключение табов в API клиенте
    document.querySelectorAll('.api-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех табов
            document.querySelectorAll('.api-tab').forEach(t => t.classList.remove('active'));
            // Скрываем все контенты табов
            document.querySelectorAll('.api-client-tab-content').forEach(c => c.classList.remove('active'));
            
            // Активируем выбранный таб и его контент
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-tab`;
            document.getElementById(tabId)?.classList.add('active');
        });
    });
    
    // Переключение табов в разделе ответа
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.response-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-response-tab`;
            document.getElementById(tabId)?.classList.add('active');
        });
    });
    
    // Кнопка сброса запроса
    document.getElementById('reset-request')?.addEventListener('click', apiClient.resetRequest);
    
    // Кнопка форматирования JSON
    document.getElementById('format-json-btn')?.addEventListener('click', apiClient.formatJsonBody);
    
    // Обработчики для AI-ассистента
    // Эти обработчики будут добавлены после создания соответствующих модулей
    
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне их содержимого
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Добавление обработчика для клавиши Escape, чтобы закрыть модальные окна
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

/**
 * Инициализация приложения
 * @returns {Promise<void>}
 */
export async function init() {
    try {
        // Инициализация модулей
        await apiSources.init();
        apiClient.init();
        logger.init();
        loggerUI.init();
        indicator.init();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Загрузка задач и прогресса
        await tasks.loadTasks();
        
        // Инициализация UI
        ui.init();
        
        // Инициализация фильтров списка заданий
        taskList.initFilters();
        
        // Ручной вызов отрисовки списка заданий
        taskList.renderTaskList();
        
        // Отображаем информацию о приложении в консоли
        console.log('API-Quest инициализирован', {
            версия: config.VERSION,
            режим: getAppMode(),
            источникAPI: apiSources.getCurrentSourceInfo().name
        });
        
        // Генерируем событие инициализации
        events.emit('appInitialized');
        
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
        // В случае ошибки показываем уведомление
        ui.showNotification('Произошла ошибка при инициализации приложения', 'error');
    }
}

// Экспорт для обратной совместимости со старым кодом
window.AppMain = {
    getCurrentTask,
    setCurrentTask,
    getAppMode
};

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', init);