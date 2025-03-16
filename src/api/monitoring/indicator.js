/**
 * Модуль индикатора статуса API-источников
 * @module api/monitoring/indicator
 */

import { getCurrentSourceInfo, getAvailableSources, setApiSource } from '../sources/index.js';
import { showNotification } from '../../ui/notifications.js';
import { on, off } from '../../core/events.js';
import { addIndicatorStyles } from './indicator-styles.js';

// Приватные переменные
// Конфигурация индикаторов для разных источников
const sourceConfig = {
    mock: {
        name: 'Симулятор API',
        icon: 'fa-server',
        color: '#3498db'
    },
    public: {
        name: 'Публичные API',
        icon: 'fa-globe',
        color: '#2ecc71'
    },
    custom: {
        name: 'Учебный API',
        icon: 'fa-graduation-cap',
        color: '#9b59b6'
    }
};

// Состояние индикаторов
const indicatorState = {
    mock: { available: true, latency: 0, lastCheck: Date.now() },
    public: { available: false, latency: 0, lastCheck: Date.now() },
    custom: { available: false, latency: 0, lastCheck: Date.now() }
};

// Обработчики событий
const eventHandlers = {};

/**
 * Создание индикатора состояния
 * @returns {HTMLElement|null} Элемент индикатора или null
 * @private
 */
function createIndicator() {
    // Проверяем, существует ли уже индикатор
    let indicatorContainer = document.getElementById('api-source-indicator');
    
    if (!indicatorContainer) {
        // Создаем контейнер для индикатора
        indicatorContainer = document.createElement('div');
        indicatorContainer.id = 'api-source-indicator';
        indicatorContainer.className = 'api-source-indicator';
        
        // Находим место для добавления индикатора (рядом с источниками API)
        const headerActions = document.querySelector('.content-header .actions');
        
        if (headerActions) {
            // Вставляем перед селектором источников, если он есть
            const sourceSelector = headerActions.querySelector('.api-source-selector-container');
            if (sourceSelector) {
                headerActions.insertBefore(indicatorContainer, sourceSelector);
            } else {
                headerActions.appendChild(indicatorContainer);
            }
        } else {
            // Если не нашли нужный контейнер, добавляем в конец header
            const header = document.querySelector('.main-header');
            if (header) {
                header.appendChild(indicatorContainer);
            } else {
                return null; // Не нашли подходящего места
            }
        }
        
        // Добавляем стили
        addIndicatorStyles();
    }
    
    // Обновляем содержимое индикатора
    updateIndicator();
    
    return indicatorContainer;
}

/**
 * Обновление состояния индикатора
 * @private
 */
function updateIndicator() {
    const indicatorContainer = document.getElementById('api-source-indicator');
    if (!indicatorContainer) return;
    
    // Очищаем контейнер
    indicatorContainer.innerHTML = '';
    
    // Получаем информацию о текущем источнике
    const currentSource = getCurrentSourceInfo();
    
    // Создаем индикаторы для каждого источника
    for (const [sourceKey, state] of Object.entries(indicatorState)) {
        // Получаем конфигурацию для источника
        const config = sourceConfig[sourceKey] || {
            name: 'Неизвестный источник',
            icon: 'fa-question-circle',
            color: '#95a5a6'
        };
        
        // Создаем элемент индикатора
        const indicator = document.createElement('div');
        indicator.className = `source-indicator ${state.available ? 'available' : 'unavailable'} ${sourceKey === currentSource.key ? 'active' : ''}`;
        indicator.title = `${config.name}: ${state.available ? 'Доступен' : 'Недоступен'}`;
        
        // Задаем стиль в зависимости от состояния
        indicator.style.setProperty('--indicator-color', config.color);
        
        // Создаем индикатор статуса
        const statusDot = document.createElement('span');
        statusDot.className = 'status-dot';
        
        // Создаем иконку
        const icon = document.createElement('i');
        icon.className = `fas ${config.icon}`;
        
        // Добавляем анимацию "пульса" для текущего источника
        if (sourceKey === currentSource.key) {
            statusDot.classList.add('pulse');
        }
        
        // Собираем индикатор
        indicator.appendChild(statusDot);
        indicator.appendChild(icon);
        
        // Добавляем обработчик клика для быстрого переключения
        indicator.addEventListener('click', () => {
            if (sourceKey !== currentSource.key) {
                setApiSource(sourceKey);
            }
        });
        
        // Добавляем в контейнер
        indicatorContainer.appendChild(indicator);
    }
}

/**
 * Обновление состояния источников на основе данных
 * @private
 */
function updateSourceState() {
    // Получаем доступные источники из ApiSourceManager
    const availableSources = getAvailableSources();
    
    // Получаем текущее состояние перед обновлением для сравнения
    const previousState = JSON.parse(JSON.stringify(indicatorState));
    
    // Обновляем состояние индикаторов
    for (const source of availableSources) {
        if (indicatorState[source.key]) {
            indicatorState[source.key].available = true;
            indicatorState[source.key].lastCheck = Date.now();
        }
    }
    
    // Для оставшихся источников, которых нет в списке доступных
    for (const sourceKey in indicatorState) {
        if (!availableSources.some(s => s.key === sourceKey)) {
            indicatorState[sourceKey].available = false;
            indicatorState[sourceKey].lastCheck = Date.now();
        }
    }
    
    // Mock всегда доступен
    indicatorState.mock.available = true;
    
    // Проверяем изменения в доступности и показываем уведомления
    checkAvailabilityChanges(previousState, indicatorState);
    
    // Обновляем отображение
    updateIndicator();
}

/**
 * Измерение латентности для источников API
 * @param {string} sourceKey - Ключ источника
 * @returns {Promise<void>}
 * @private
 */
async function measureLatency(sourceKey) {
    if (!indicatorState[sourceKey] || sourceKey === 'mock') {
        return; // Пропускаем для mock или несуществующих источников
    }
    
    const startTime = performance.now();
    
    try {
        let url;
        if (sourceKey === 'public') {
            url = 'https://jsonplaceholder.typicode.com/health';
        } else if (sourceKey === 'custom') {
            url = 'https://api-quest.example.com/api/health';
        } else {
            return;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {'X-API-Quest-Client': 'Health-Check'},
            cache: 'no-cache'
        });
        
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        // Обновляем состояние
        indicatorState[sourceKey].latency = latency;
        indicatorState[sourceKey].available = response.ok;
        indicatorState[sourceKey].lastCheck = Date.now();
        
        // Обновляем индикатор с новой латентностью
        updateIndicator();
        updateTooltips();
        
    } catch (error) {
        const endTime = performance.now();
        
        // Обновляем состояние - недоступен
        indicatorState[sourceKey].available = false;
        indicatorState[sourceKey].latency = Math.round(endTime - startTime);
        indicatorState[sourceKey].lastCheck = Date.now();
        
        // Обновляем индикатор
        updateIndicator();
        updateTooltips();
    }
}

/**
 * Запуск периодических проверок латентности
 * @private
 */
function startLatencyChecks() {
    // Сначала измеряем для всех источников
    measureLatency('public');
    measureLatency('custom');
    
    // Затем запускаем периодические проверки
    setInterval(() => {
        measureLatency('public');
        measureLatency('custom');
    }, 60000); // Проверка каждую минуту
}

/**
 * Проверка изменений в доступности источников
 * @param {Object} oldState - Предыдущее состояние
 * @param {Object} newState - Новое состояние
 * @private
 */
function checkAvailabilityChanges(oldState, newState) {
    // Сравниваем текущее состояние с предыдущим
    for (const sourceKey in newState) {
        const wasAvailable = oldState[sourceKey]?.available;
        const isAvailable = newState[sourceKey]?.available;
        
        // Если статус изменился, показываем уведомление
        if (wasAvailable !== isAvailable) {
            showSourceStatusNotification(sourceKey, isAvailable);
        }
    }
}

/**
 * Добавление сообщения уведомления о проблемах с источником API
 * @param {string} sourceKey - Ключ источника
 * @param {boolean} available - Доступность
 * @private
 */
function showSourceStatusNotification(sourceKey, available) {
    if (!sourceKey) return;
    
    const source = sourceConfig[sourceKey] || { name: 'Неизвестный источник' };
    
    if (available) {
        showNotification(`${source.name} снова доступен`, 'success');
    } else {
        showNotification(`${source.name} недоступен, используется резервный источник`, 'warning');
    }
}

/**
 * Обновление подсказок для индикаторов
 * @private
 */
function updateTooltips() {
    // Обновляем title для индикаторов с актуальной информацией о источниках
    for (const sourceKey in indicatorState) {
        const indicator = document.querySelector(`.source-indicator[data-source="${sourceKey}"]`);
        if (indicator) {
            const tooltipContent = getTooltipContent(sourceKey);
            indicator.title = tooltipContent;
        }
    }
}

/**
 * Получение HTML для всплывающей подсказки
 * @param {string} sourceKey - Ключ источника
 * @returns {string} Текст подсказки
 * @private
 */
function getTooltipContent(sourceKey) {
    if (!indicatorState[sourceKey]) return '';
    
    const state = indicatorState[sourceKey];
    const config = sourceConfig[sourceKey] || { name: 'Неизвестный источник' };
    
    let content = `${config.name}\n`;
    content += `Статус: ${state.available ? 'Доступен' : 'Недоступен'}\n`;
    
    if (state.latency > 0) {
        content += `Задержка: ${state.latency} мс\n`;
    }
    
    if (state.lastCheck) {
        const lastCheckTime = new Date(state.lastCheck).toLocaleTimeString();
        content += `Последняя проверка: ${lastCheckTime}`;
    }
    
    return content;
}

/**
 * Обработчик события изменения источника API
 * @param {Object} data - Данные события
 * @private
 */
function onApiSourceChanged(data) {
    // Обновляем индикатор при изменении источника
    updateIndicator();
}

/**
 * Обработчик события обновления доступности источников
 * @param {Array} sources - Доступные источники
 * @private
 */
function onApiSourcesUpdated(sources) {
    // Обновляем индикаторы при изменении доступности источников
    updateSourceState();
}

/**
 * Инициализация модуля
 */
export function init() {
    // Создаем индикатор состояния
    createIndicator();
    
    // Обновляем состояние на основе данных ApiSourceManager
    updateSourceState();
    
    // Запускаем проверки латентности
    startLatencyChecks();
    
    // Добавляем слушатель событий для обновления индикатора при изменении источника
    eventHandlers.apiSourceChanged = onApiSourceChanged;
    eventHandlers.apiSourcesUpdated = onApiSourcesUpdated;
    
    on('apiSourceChanged', eventHandlers.apiSourceChanged);
    on('apiSourcesUpdated', eventHandlers.apiSourcesUpdated);
    
    // Периодически обновляем индикатор
    setInterval(updateSourceState, 30000); // Обновляем каждые 30 секунд
}

/**
 * Получение состояния источника
 * @param {string} [sourceKey] - Ключ источника
 * @returns {Object} Состояние источника или всех источников
 */
export function getSourceState(sourceKey) {
    return sourceKey ? { ...indicatorState[sourceKey] } : { ...indicatorState };
}

/**
 * Очистка ресурсов модуля
 */
export function cleanup() {
    // Отписываемся от событий
    if (eventHandlers.apiSourceChanged) {
        off('apiSourceChanged', eventHandlers.apiSourceChanged);
    }
    
    if (eventHandlers.apiSourcesUpdated) {
        off('apiSourcesUpdated', eventHandlers.apiSourcesUpdated);
    }
    
    // Очищаем ссылки на обработчики
    Object.keys(eventHandlers).forEach(key => {
        delete eventHandlers[key];
    });
    
    // Удаляем UI элементы
    const indicatorContainer = document.getElementById('api-source-indicator');
    if (indicatorContainer) {
        indicatorContainer.remove();
    }
}