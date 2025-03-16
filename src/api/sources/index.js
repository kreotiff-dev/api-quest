/**
 * Модуль управления источниками API
 * @module api/sources
 */

import { apiSourceConfig, defaultSourceState, STORAGE_KEY } from './config.js';
import * as mockAdapter from './mock.js';
import * as publicAdapter from './public.js';
import * as customAdapter from './custom.js';
import { showNotification } from '../../ui/notifications.js';
import { toggleLoadingIndicator } from '../../ui/loading.js';
import { saveCurrentSolution, updateTaskAttempt } from '../../core/progress.js';
import { emit } from '../../core/events.js';

// Адаптеры для разных источников API
const adapters = {
    mock: mockAdapter,
    public: publicAdapter,
    custom: customAdapter
};

// Текущий выбранный источник API
let currentSource = 'mock';

// Состояние источников API
let sourceState = { ...defaultSourceState };

/**
 * Инициализация модуля
 * @returns {Promise<void>}
 */
export async function init() {
    // Загружаем сохраненный выбор источника
    const savedSource = localStorage.getItem(STORAGE_KEY);
    if (savedSource && apiSourceConfig[savedSource]) {
        currentSource = savedSource;
    }
    
    // Проверяем доступность API-источников
    await checkApiAvailability();
    
    // Создаем селектор источников, если его еще нет
    createSourceSelector();
    
    // Устанавливаем интервал проверки доступности API
    setInterval(checkApiAvailability, 60000); // Каждую минуту
}

/**
 * Проверка доступности API источников
 * @returns {Promise<void>}
 */
export async function checkApiAvailability() {
    try {
        // Проверка публичного API
        try {
            const publicResponse = await fetch(`${apiSourceConfig.public.baseUrl}/health`, {
                method: 'GET',
                headers: {'X-API-Quest-Client': 'Health-Check'},
                timeout: 5000 // Таймаут 5 секунд
            });
            sourceState.public.isAvailable = publicResponse.ok;
        } catch (error) {
            sourceState.public.isAvailable = false;
            console.log('Публичный API недоступен:', error.message);
        }
        
        try {
            // Проверка собственного API
            const customResponse = await fetch(`${apiSourceConfig.custom.baseUrl}/health`, {
                method: 'GET',
                headers: {'X-API-Quest-Client': 'Health-Check'},
                timeout: 5000 // Таймаут 5 секунд
            });
            sourceState.custom.isAvailable = customResponse.ok;
        } catch (error) {
            sourceState.custom.isAvailable = false;
            console.log('Собственный API недоступен:', error.message);
        }
        
        // Обновляем селектор источников
        updateSourceSelector();
        
        // Выбираем оптимальный источник, если текущий недоступен
        autoSelectSource();
        
        // Уведомляем о изменении состояния источников API
        emit('apiSourcesUpdated', getAvailableSources());
        
    } catch (error) {
        console.error('Ошибка при проверке доступности API:', error);
    }
}

/**
 * Автоматический выбор оптимального источника при недоступности текущего
 * @private
 */
function autoSelectSource() {
    // Если текущий источник доступен, оставляем его
    if (sourceState[currentSource].isAvailable) {
        return;
    }
    
    // Сортируем источники по приоритету и доступности
    const availableSources = Object.keys(sourceState)
        .filter(source => sourceState[source].isAvailable)
        .sort((a, b) => sourceState[a].priority - sourceState[b].priority);
    
    if (availableSources.length > 0) {
        // Выбираем источник с наивысшим приоритетом
        setApiSource(availableSources[0]);
    } else {
        // Если нет доступных источников, используем моки
        setApiSource('mock');
    }
}

/**
 * Обновление селектора источников в UI
 * @private
 */
function updateSourceSelector() {
    const selector = document.getElementById('api-source-selector');
    if (!selector) return;
    
    // Очищаем текущие опции
    selector.innerHTML = '';
    
    // Добавляем опции для каждого источника
    Object.keys(apiSourceConfig).forEach(sourceKey => {
        const source = apiSourceConfig[sourceKey];
        const option = document.createElement('option');
        option.value = sourceKey;
        option.textContent = source.name;
        option.disabled = !sourceState[sourceKey].isAvailable;
        
        if (sourceKey === currentSource) {
            option.selected = true;
        }
        
        selector.appendChild(option);
    });
}

/**
 * Создание селектора источников API в интерфейсе
 * @private
 */
function createSourceSelector() {
    // Проверяем, существует ли уже селектор
    if (document.getElementById('api-source-selector')) {
        return;
    }
    
    // Создаем контейнер для селектора
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'api-source-selector-container';
    
    // Создаем лейбл
    const label = document.createElement('label');
    label.htmlFor = 'api-source-selector';
    label.textContent = 'Источник API:';
    
    // Создаем селектор
    const selector = document.createElement('select');
    selector.id = 'api-source-selector';
    selector.className = 'form-control';
    
    // Добавляем обработчик изменения
    selector.addEventListener('change', function() {
        setApiSource(this.value);
    });
    
    // Добавляем селектор в контейнер
    selectorContainer.appendChild(label);
    selectorContainer.appendChild(selector);
    
    // Добавляем селектор на страницу
    const actionsContainer = document.querySelector('.content-header .actions');
    if (actionsContainer) {
        actionsContainer.appendChild(selectorContainer);
    }
    
    // Заполняем селектор и выбираем текущий источник
    updateSourceSelector();
}

/**
 * Установка текущего источника API
 * @param {string} sourceKey - Ключ источника API
 * @returns {boolean} - Успешность установки источника
 */
export function setApiSource(sourceKey) {
    if (!apiSourceConfig[sourceKey]) {
        console.error('Неизвестный источник API:', sourceKey);
        return false;
    }
    
    // Запоминаем предыдущий источник для логирования
    const previousSource = currentSource;
    
    if (!sourceState[sourceKey].isAvailable && sourceKey !== 'mock') {
        console.warn(`Источник API "${apiSourceConfig[sourceKey].name}" недоступен. Используется резервный источник.`);
        autoSelectSource();
        return false;
    }
    
    currentSource = sourceKey;
    
    // Обновляем локальное хранилище
    localStorage.setItem(STORAGE_KEY, sourceKey);
    
    // Обновляем селектор в интерфейсе
    updateSourceSelector();
    
    // Уведомляем об изменении источника
    showNotification(`Источник API изменен на "${apiSourceConfig[sourceKey].name}"`, 'info');
    
    // Уведомляем о изменении источника API через систему событий
    emit('apiSourceChanged', { previous: previousSource, current: sourceKey });
    
    return true;
}

/**
 * Отправка запроса через текущий адаптер
 * @param {Object} request - Объект запроса
 * @returns {Promise<Object>} - Промис с ответом
 */
export async function sendRequest(request) {
    const adapter = adapters[currentSource];
    
    // Показываем индикатор загрузки
    toggleLoadingIndicator('response-meta', true);
    document.getElementById('response-body').textContent = 'Загрузка...';
    
    try {
        // Отправляем запрос через выбранный адаптер
        const response = await adapter.sendRequest(request);
        
        // Сохраняем решение
        saveCurrentSolution();
        
        // Обновляем прогресс задания
        const task = getCurrentTask();
        if (task) {
            updateTaskAttempt(task.id);
        }
        
        return response;
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        
        // В случае ошибки возвращаем специальный ответ
        return {
            status: 500,
            statusText: 'Error',
            headers: {'Content-Type': 'application/json'},
            body: {
                error: 'Ошибка при отправке запроса',
                message: error.message,
                source: currentSource
            }
        };
    } finally {
        // Скрываем индикатор загрузки
        toggleLoadingIndicator('response-meta', false);
    }
}

/**
 * Получение информации о текущем источнике API
 * @returns {Object} - Информация о текущем источнике
 */
export function getCurrentSourceInfo() {
    return {
        key: currentSource,
        ...apiSourceConfig[currentSource],
        isAvailable: sourceState[currentSource].isAvailable,
        priority: sourceState[currentSource].priority
    };
}

/**
 * Получение списка всех доступных источников API
 * @returns {Array} - Массив доступных источников
 */
export function getAvailableSources() {
    return Object.keys(apiSourceConfig)
        .filter(key => sourceState[key].isAvailable)
        .map(key => ({
            key,
            name: apiSourceConfig[key].name,
            description: apiSourceConfig[key].description,
            priority: sourceState[key].priority
        }));
}

/**
 * Получение текущего задания из глобального контекста
 * @private
 * @returns {Object|null} - Текущее задание или null
 */
function getCurrentTask() {
    return window.AppMain?.getCurrentTask() || null;
}