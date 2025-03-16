/**
 * Модуль API-клиента для отправки запросов
 * @module api/client
 */

import { sendRequest, getCurrentSourceInfo, setApiSource } from '../sources/index.js';
import { showNotification } from '../../ui/notifications.js';
import { getCurrentTask } from '../../core/tasks.js';
import { addHeaderRow, resetResponse, formatJsonBody, createSourceDropdown } from './ui.js';
import { showApiResponse } from './renderer.js';

/**
 * Отправка API-запроса
 * @returns {Promise<void>}
 */
export async function sendApiRequest() {
    const task = getCurrentTask();
    if (!task) return;
    
    // Получение данных запроса
    const method = document.getElementById('request-method').value;
    const url = document.getElementById('request-url').value;
    
    // Сбор заголовков
    const headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        
        if (key && value) {
            headers[key] = value;
        }
    });
    
    // Получение тела запроса
    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            const bodyText = document.getElementById('request-body').value.trim();
            if (bodyText) {
                requestBody = JSON.parse(bodyText);
            }
        } catch (e) {
            showApiResponse({
                status: 400,
                statusText: 'Error parsing request body',
                headers: {'Content-Type': 'application/json'},
                body: { error: 'Invalid JSON in request body' }
            });
            return;
        }
    }
    
    // Формируем объект запроса
    const request = {
        method,
        url,
        headers,
        body: requestBody
    };
    
    // Добавляем индикатор загрузки
    document.getElementById('response-meta').innerHTML = '<div class="loading-spinner"></div>';
    document.getElementById('response-body').textContent = 'Загрузка...';
    document.getElementById('response-headers').textContent = '';
    
    try {
        // Отправляем запрос через ApiSourceManager
        const response = await sendRequest(request);
        
        // Отображаем ответ
        showApiResponse(response);
    } catch (error) {
        // Обработка ошибок при отправке запроса
        showApiResponse({
            status: 500,
            statusText: 'Error',
            headers: {'Content-Type': 'application/json'},
            body: {
                error: 'Ошибка при отправке запроса',
                message: error.message
            }
        });
    }
}

/**
 * Сброс запроса к начальным значениям для задания
 */
export function resetRequest() {
    const task = getCurrentTask();
    if (!task) return;
    
    // Сбрасываем поля к исходным значениям для задания
    if (task.solution) {
        // URL из задания
        if (task.solution.url) {
            document.getElementById('request-url').value = task.solution.url;
        } else {
            document.getElementById('request-url').value = '';
        }
        
        // Метод из задания
        if (task.solution.method) {
            document.getElementById('request-method').value = task.solution.method;
        }
        
        // Очистка заголовков
        document.getElementById('headers-container').innerHTML = '';
        
        // Добавление заголовков из решения, если они есть
        if (task.solution.headers) {
            for (const [key, value] of Object.entries(task.solution.headers)) {
                addHeaderRow(key, '');
            }
        } else {
            // Добавление пустого заголовка
            addHeaderRow();
        }
        
        // Сброс тела запроса
        const requestBody = document.getElementById('request-body');
        
        if (task.solution.body && typeof task.solution.body === 'object') {
            // Если тело запроса - объект с "placeholder" значениями (true)
            const templateBody = {};
            
            for (const [key, value] of Object.entries(task.solution.body)) {
                if (value === true) {
                    // Если значение true, это placeholder
                    templateBody[key] = "";
                } else {
                    // Иначе используем фиксированное значение
                    templateBody[key] = value;
                }
            }
            
            requestBody.value = JSON.stringify(templateBody, null, 2);
        } else {
            requestBody.value = '';
        }
        
        // Обновляем интерфейс в зависимости от метода
        setupApiClientInterface(task);
    } else {
        // Если нет решения, просто очищаем все поля
        document.getElementById('request-url').value = '';
        document.getElementById('headers-container').innerHTML = '';
        document.getElementById('request-body').value = '';
        addHeaderRow();
    }
    
    // Очищаем поля ответа
    resetResponse();
}

/**
 * Переключение источника API
 * @param {string} sourceKey - Ключ источника API
 */
export function switchApiSource(sourceKey) {
    if (setApiSource(sourceKey)) {
        showNotification(`Источник API переключен на ${getCurrentSourceInfo().name}`, 'info');
    } else {
        showNotification('Не удалось переключить источник API', 'error');
    }
}

/**
 * Показать/скрыть выпадающий список источников API
 */
export function toggleSourceSelector() {
    let sourceDropdown = document.getElementById('api-source-dropdown');
    
    if (sourceDropdown) {
        sourceDropdown.classList.toggle('show');
    } else {
        createSourceDropdown();
    }
}

/**
 * Настройка интерфейса API-клиента для задания
 * @param {Object} task - Задание
 */
export function setupApiClientInterface(task) {
    // Обновляем интерфейс в зависимости от метода запроса
    updateUIForMethod(task.solution?.method || 'GET');
}

/**
 * Обновление интерфейса в зависимости от метода запроса
 * @param {string} method - HTTP метод
 */
function updateUIForMethod(method) {
    const requestBody = document.getElementById('request-body').parentElement;
    
    // Скрываем/показываем редактор тела запроса в зависимости от метода
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestBody.style.display = 'block';
    } else {
        requestBody.style.display = 'none';
    }
    
    // Добавляем автоматически заголовок Content-Type для методов с телом запроса
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const headersContainer = document.getElementById('headers-container');
        const contentTypeExists = Array.from(headersContainer.querySelectorAll('.header-key')).some(input => 
            input.value.toLowerCase() === 'content-type');
        
        if (!contentTypeExists) {
            addHeaderRow('Content-Type', document.getElementById('request-content-type').value);
        }
    }
}

/**
 * Инициализация модуля
 */
export function init() {
    // Добавляем кнопку для быстрого переключения источника API в панель инструментов
    const actionsContainer = document.querySelector('.content-header .actions');
    if (actionsContainer) {
        const sourceButton = document.createElement('button');
        sourceButton.className = 'btn btn-source-selector';
        sourceButton.innerHTML = '<i class="fas fa-server"></i> Источник API';
        sourceButton.addEventListener('click', toggleSourceSelector);
        
        actionsContainer.appendChild(sourceButton);
    }
    
    // Добавляем обработчики событий
    document.getElementById('send-request')?.addEventListener('click', sendApiRequest);
    document.getElementById('reset-request')?.addEventListener('click', resetRequest);
    document.getElementById('format-json-btn')?.addEventListener('click', formatJsonBody);
}

// Экспорт дополнительных функций из ui.js для обратной совместимости
export { addHeaderRow, formatJsonBody };