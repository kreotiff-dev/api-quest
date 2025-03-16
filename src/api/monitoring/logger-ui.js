/**
 * UI-компоненты для логов HTTP
 * @module api/monitoring/logger-ui
 */

import { LOG_TYPES, getLogs, filterLogs, clearLogs, toggleLogging } from './logger.js';
import { showNotification } from '../../ui/notifications.js';
import { on, off } from '../../core/events.js';

// Обработчики событий
const eventHandlers = {};

/**
 * Создание панели логов
 * @returns {HTMLElement} Элемент панели логов
 */
function createLogsPanel() {
    // Проверяем, существует ли уже панель
    let logsPanel = document.getElementById('http-logs-panel');
    
    if (!logsPanel) {
        // Создаем панель
        logsPanel = document.createElement('div');
        logsPanel.id = 'http-logs-panel';
        logsPanel.className = 'logs-panel';
        logsPanel.style.display = 'none';
        
        // Создаем заголовок панели
        const header = document.createElement('div');
        header.className = 'logs-panel-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Логи HTTP-запросов';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'logs-panel-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            logsPanel.style.display = 'none';
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Создаем фильтры
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'logs-panel-filters';
        
        // Фильтр по типу
        const typeFilter = document.createElement('select');
        typeFilter.className = 'logs-filter';
        typeFilter.id = 'logs-filter-type';
        
        const typeOptions = [
            { value: '', label: 'Все типы' },
            { value: LOG_TYPES.REQUEST, label: 'Запросы' },
            { value: LOG_TYPES.RESPONSE, label: 'Ответы' },
            { value: LOG_TYPES.ERROR, label: 'Ошибки' }
        ];
        
        typeOptions.forEach(option => {
            const optElem = document.createElement('option');
            optElem.value = option.value;
            optElem.textContent = option.label;
            typeFilter.appendChild(optElem);
        });
        
        typeFilter.addEventListener('change', renderLogsPanel);
        
        // Фильтр по источнику
        const sourceFilter = document.createElement('select');
        sourceFilter.className = 'logs-filter';
        sourceFilter.id = 'logs-filter-source';
        
        const sourceOptions = [
            { value: '', label: 'Все источники' },
            { value: 'mock', label: 'Симулятор API' },
            { value: 'public', label: 'Публичные API' },
            { value: 'custom', label: 'Учебный API' }
        ];
        
        sourceOptions.forEach(option => {
            const optElem = document.createElement('option');
            optElem.value = option.value;
            optElem.textContent = option.label;
            sourceFilter.appendChild(optElem);
        });
        
        sourceFilter.addEventListener('change', renderLogsPanel);
        
        // Поле поиска
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Поиск в логах...';
        searchInput.className = 'logs-search';
        searchInput.id = 'logs-search';
        
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(renderLogsPanel, 300);
        });
        
        // Кнопки действий
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'logs-panel-actions';
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'logs-clear-btn';
        clearBtn.textContent = 'Очистить логи';
        clearBtn.addEventListener('click', clearLogs);
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'logs-toggle-btn';
        toggleBtn.id = 'logs-toggle-btn';
        toggleBtn.textContent = 'Отключить логирование';
        toggleBtn.addEventListener('click', () => {
            const enabled = toggleLogging();
            toggleBtn.textContent = enabled ? 'Отключить логирование' : 'Включить логирование';
        });
        
        actionsContainer.appendChild(clearBtn);
        actionsContainer.appendChild(toggleBtn);
        
        // Добавляем фильтры в контейнер
        filtersContainer.appendChild(typeFilter);
        filtersContainer.appendChild(sourceFilter);
        filtersContainer.appendChild(searchInput);
        filtersContainer.appendChild(actionsContainer);
        
        // Создаем контейнер для списка логов
        const logsContainer = document.createElement('div');
        logsContainer.className = 'logs-container';
        logsContainer.id = 'logs-container';
        
        // Собираем панель
        logsPanel.appendChild(header);
        logsPanel.appendChild(filtersContainer);
        logsPanel.appendChild(logsContainer);
        
        // Добавляем панель на страницу
        document.body.appendChild(logsPanel);
        
        // Добавляем стили
        addLogsPanelStyles();
    }
    
    return logsPanel;
}

/**
 * Отрисовка содержимого панели логов
 */
function renderLogsPanel() {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;
    
    // Получаем значения фильтров
    const typeFilter = document.getElementById('logs-filter-type');
    const sourceFilter = document.getElementById('logs-filter-source');
    const searchInput = document.getElementById('logs-search');
    
    const filters = {
        type: typeFilter ? typeFilter.value : '',
        source: sourceFilter ? sourceFilter.value : '',
        search: searchInput ? searchInput.value : ''
    };
    
    // Фильтруем логи
    const filteredLogs = filterLogs(filters);
    
    // Очищаем контейнер
    logsContainer.innerHTML = '';
    
    if (filteredLogs.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'logs-empty-message';
        emptyMessage.textContent = 'Нет логов для отображения';
        logsContainer.appendChild(emptyMessage);
        return;
    }
    
    // Создаем элементы для каждого лога
    filteredLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = `log-item log-${log.type}`;
        logItem.dataset.id = log.id;
        
        // Заголовок лога
        const logHeader = document.createElement('div');
        logHeader.className = 'log-header';
        
        // Иконка типа
        const typeIcon = document.createElement('span');
        typeIcon.className = 'log-type-icon';
        
        if (log.type === LOG_TYPES.REQUEST) {
            typeIcon.innerHTML = '<i class="fas fa-arrow-up"></i>';
            typeIcon.title = 'Запрос';
        } else if (log.type === LOG_TYPES.RESPONSE) {
            typeIcon.innerHTML = '<i class="fas fa-arrow-down"></i>';
            typeIcon.title = 'Ответ';
        } else {
            typeIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            typeIcon.title = 'Ошибка';
        }
        
        // Время
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        const logDate = new Date(log.timestamp);
        timestamp.textContent = logDate.toLocaleTimeString();
        timestamp.title = logDate.toLocaleString();
        
        // Источник API
        const source = document.createElement('span');
        source.className = 'log-source';
        source.textContent = log.source;
        
        // Основная информация
        const info = document.createElement('span');
        info.className = 'log-info';
        
        if (log.type === LOG_TYPES.REQUEST) {
            info.textContent = `${log.data.method} ${log.data.url}`;
        } else if (log.type === LOG_TYPES.RESPONSE) {
            info.textContent = `${log.data.status} ${log.data.statusText || ''}`;
            
            // Добавляем класс в зависимости от статуса
            if (log.data.status >= 200 && log.data.status < 300) {
                info.classList.add('log-status-success');
            } else if (log.data.status >= 300 && log.data.status < 400) {
                info.classList.add('log-status-redirect');
            } else if (log.data.status >= 400) {
                info.classList.add('log-status-error');
            }
        } else {
            info.textContent = log.data.message;
            info.classList.add('log-status-error');
        }
        
        // Кнопка раскрытия деталей
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'log-toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggleBtn.title = 'Показать детали';
        
        toggleBtn.addEventListener('click', () => {
            const details = logItem.querySelector('.log-details');
            if (details.style.display === 'none') {
                details.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                toggleBtn.title = 'Скрыть детали';
            } else {
                details.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                toggleBtn.title = 'Показать детали';
            }
        });
        
        // Собираем заголовок
        logHeader.appendChild(typeIcon);
        logHeader.appendChild(timestamp);
        logHeader.appendChild(source);
        logHeader.appendChild(info);
        logHeader.appendChild(toggleBtn);
        
        // Детали лога
        const logDetails = document.createElement('div');
        logDetails.className = 'log-details';
        logDetails.style.display = 'none';
        
        if (log.type === LOG_TYPES.REQUEST || log.type === LOG_TYPES.RESPONSE) {
            // Заголовки
            if (log.data.headers) {
                const headersTitle = document.createElement('h4');
                headersTitle.textContent = 'Заголовки:';
                logDetails.appendChild(headersTitle);
                
                const headersList = document.createElement('div');
                headersList.className = 'log-headers';
                
                for (const [key, value] of Object.entries(log.data.headers)) {
                    const headerItem = document.createElement('div');
                    headerItem.className = 'log-header-item';
                    headerItem.innerHTML = `<strong>${key}:</strong> ${value}`;
                    headersList.appendChild(headerItem);
                }
                
                logDetails.appendChild(headersList);
            }
            
            // Тело запроса/ответа
            if (log.data.body) {
                const bodyTitle = document.createElement('h4');
                bodyTitle.textContent = 'Тело:';
                logDetails.appendChild(bodyTitle);
                
                const bodyContent = document.createElement('pre');
                bodyContent.className = 'log-body';
                
                try {
                    // Пытаемся отформатировать JSON для лучшей читаемости
                    const bodyStr = typeof log.data.body === 'string' 
                        ? log.data.body 
                        : JSON.stringify(log.data.body, null, 2);
                    bodyContent.textContent = bodyStr;
                } catch (e) {
                    bodyContent.textContent = String(log.data.body);
                }
                
                logDetails.appendChild(bodyContent);
            }
        } else if (log.type === LOG_TYPES.ERROR) {
            // Сообщение об ошибке
            const errorMessage = document.createElement('div');
            errorMessage.className = 'log-error-message';
            errorMessage.textContent = log.data.message;
            logDetails.appendChild(errorMessage);
            
            // Стек ошибки, если есть
            if (log.data.stack) {
                const stackTitle = document.createElement('h4');
                stackTitle.textContent = 'Стек вызовов:';
                logDetails.appendChild(stackTitle);
                
                const stackContent = document.createElement('pre');
                stackContent.className = 'log-stack';
                stackContent.textContent = log.data.stack;
                logDetails.appendChild(stackContent);
            }
        }
        
        // Добавляем копирование в буфер обмена
        const copyBtn = document.createElement('button');
        copyBtn.className = 'log-copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать';
        copyBtn.title = 'Копировать в буфер обмена';
        
        copyBtn.addEventListener('click', () => {
            copyLogToClipboard(log);
        });
        
        logDetails.appendChild(copyBtn);
        
        // Собираем элемент лога
        logItem.appendChild(logHeader);
        logItem.appendChild(logDetails);
        
        // Добавляем в контейнер
        logsContainer.appendChild(logItem);
    });
}

/**
 * Копирование лога в буфер обмена
 * @param {Object} log - Объект лога
 */
function copyLogToClipboard(log) {
    // Создаем текстовое представление лога
    let logText = '';
    
    if (log.type === LOG_TYPES.REQUEST) {
        logText += `# Запрос (${new Date(log.timestamp).toLocaleString()})\n`;
        logText += `${log.data.method} ${log.data.url}\n\n`;
        
        if (log.data.headers) {
            logText += '## Заголовки:\n';
            for (const [key, value] of Object.entries(log.data.headers)) {
                logText += `${key}: ${value}\n`;
            }
            logText += '\n';
        }
        
        if (log.data.body) {
            logText += '## Тело запроса:\n';
            logText += typeof log.data.body === 'string' 
                ? log.data.body 
                : JSON.stringify(log.data.body, null, 2);
        }
    } else if (log.type === LOG_TYPES.RESPONSE) {
        logText += `# Ответ (${new Date(log.timestamp).toLocaleString()})\n`;
        logText += `${log.data.status} ${log.data.statusText || ''}\n\n`;
        
        if (log.data.headers) {
            logText += '## Заголовки:\n';
            for (const [key, value] of Object.entries(log.data.headers)) {
                logText += `${key}: ${value}\n`;
            }
            logText += '\n';
        }
        
        if (log.data.body) {
            logText += '## Тело ответа:\n';
            logText += typeof log.data.body === 'string' 
                ? log.data.body 
                : JSON.stringify(log.data.body, null, 2);
        }
    } else {
        logText += `# Ошибка (${new Date(log.timestamp).toLocaleString()})\n`;
        logText += log.data.message + '\n\n';
        
        if (log.data.stack) {
            logText += '## Стек вызовов:\n';
            logText += log.data.stack;
        }
    }
    
    // Копируем в буфер обмена
    navigator.clipboard.writeText(logText)
        .then(() => {
            showNotification('Лог скопирован в буфер обмена', 'success');
        })
        .catch(err => {
            console.error('Не удалось скопировать текст: ', err);
            showNotification('Не удалось скопировать текст', 'error');
        });
}

/**
 * Отображение панели логов
 */
export function showLogsPanel() {
    const logsPanel = createLogsPanel();
    logsPanel.style.display = 'block';
    renderLogsPanel();
}

/**
 * Скрытие панели логов
 */
export function hideLogsPanel() {
    const logsPanel = document.getElementById('http-logs-panel');
    if (logsPanel) {
        logsPanel.style.display = 'none';
    }
}

/**
 * Добавление стилей для панели логов
 * @private
 */
function addLogsPanelStyles() {
    // Проверяем, существуют ли уже стили
    if (document.getElementById('logs-panel-styles')) {
        return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'logs-panel-styles';
    styles.textContent = `
        .logs-panel {
            position: fixed;
            top: 60px;
            right: 0;
            bottom: 0;
            width: 500px;
            background-color: white;
            box-shadow: -2px 0 5px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ddd;
        }
        
        .logs-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #2c3e50;
            color: white;
        }
        
        /* Остальные стили для панели логов */
    `;
    
    document.head.appendChild(styles);
}

/**
 * Добавление кнопки для открытия панели логов
 */
export function addLogsButton() {
    // Проверяем, существует ли уже кнопка
    if (document.getElementById('http-logs-button')) {
        return;
    }
    
    // Находим контейнер для кнопок
    const actionsContainer = document.querySelector('.content-header .actions');
    if (!actionsContainer) {
        return; // Не нашли контейнер для кнопок
    }
    
    // Создаем кнопку
    const logsButton = document.createElement('button');
    logsButton.id = 'http-logs-button';
    logsButton.className = 'btn';
    logsButton.innerHTML = '<i class="fas fa-exchange-alt"></i> HTTP Логи';
    logsButton.title = 'Показать логи HTTP-запросов';
    
    // Добавляем обработчик клика
    logsButton.addEventListener('click', () => {
        showLogsPanel();
    });
    
    // Добавляем кнопку на страницу
    actionsContainer.appendChild(logsButton);
}

/**
 * Обработчик события добавления лога
 * @param {Object} log - Добавленный лог
 * @private
 */
function onLogAdded(log) {
    // Если панель логов открыта, обновляем её
    const logsPanel = document.getElementById('http-logs-panel');
    if (logsPanel && logsPanel.style.display !== 'none') {
        renderLogsPanel();
    }
}

/**
 * Обработчик события очистки логов
 * @private
 */
function onLogsCleared() {
    // Если панель логов открыта, обновляем её
    const logsPanel = document.getElementById('http-logs-panel');
    if (logsPanel && logsPanel.style.display !== 'none') {
        renderLogsPanel();
    }
}

/**
 * Обработчик события переключения логирования
 * @param {boolean} enabled - Включено/выключено
 * @private
 */
function onLoggingToggled(enabled) {
    // Обновляем текст кнопки
    const toggleBtn = document.getElementById('logs-toggle-btn');
    if (toggleBtn) {
        toggleBtn.textContent = enabled ? 'Отключить логирование' : 'Включить логирование';
    }
}

/**
 * Инициализация модуля
 */
export function init() {
    // Добавляем кнопку для открытия панели логов
    addLogsButton();
    
    // Подписываемся на события
    eventHandlers.logAdded = onLogAdded;
    eventHandlers.logsCleared = onLogsCleared;
    eventHandlers.loggingToggled = onLoggingToggled;
    
    on('httpLogAdded', eventHandlers.logAdded);
    on('httpLogsCleared', eventHandlers.logsCleared);
    on('httpLoggingToggled', eventHandlers.loggingToggled);
}

/**
* Очистка ресурсов модуля
*/
export function cleanup() {
  // Отписываемся от событий
  if (eventHandlers.logAdded) {
      off('httpLogAdded', eventHandlers.logAdded);
  }
  
  if (eventHandlers.logsCleared) {
      off('httpLogsCleared', eventHandlers.logsCleared);
  }
  
  if (eventHandlers.loggingToggled) {
      off('httpLoggingToggled', eventHandlers.loggingToggled);
  }
  
  // Очищаем ссылки на обработчики
  Object.keys(eventHandlers).forEach(key => {
      delete eventHandlers[key];
  });
  
  // Удаляем UI элементы
  const logsPanel = document.getElementById('http-logs-panel');
  if (logsPanel) {
      logsPanel.remove();
  }
  
  const logsButton = document.getElementById('http-logs-button');
  if (logsButton) {
      logsButton.remove();
  }
}