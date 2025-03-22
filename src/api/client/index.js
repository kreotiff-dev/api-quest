/**
 * Модуль API-клиента для отправки запросов
 * @module api/client
 */

import { sendRequest, getCurrentSourceInfo, getAvailableSources, setApiSource } from '../sources/index.js';
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
    // Добавляем обработчики событий
    document.getElementById('send-request')?.addEventListener('click', sendApiRequest);
    document.getElementById('reset-request')?.addEventListener('click', resetRequest);
    document.getElementById('format-json-btn')?.addEventListener('click', formatJsonBody);
    
    // Стилизуем селектор источников API
    enhanceSourceSelector();
}

/**
 * Улучшение селектора источников API
 */
function enhanceSourceSelector() {
    // Ищем оригинальный селектор
    const existingSelector = document.getElementById('api-source-selector');
    if (!existingSelector) return;
    
    // Ищем родительский контейнер
    const parentContainer = existingSelector.closest('.api-source-selector-container');
    if (!parentContainer) return;
    
    // Проверяем, есть ли уже наш кастомный селектор
    if (parentContainer.querySelector('.api-source-custom-selector')) {
        console.log('Кастомный селектор уже существует, пропускаем создание');
        return;
    }
    
    // Получаем текущий выбранный источник и все доступные опции
    const selectedOption = existingSelector.options[existingSelector.selectedIndex];
    const options = Array.from(existingSelector.options);
    
    // Полностью скрываем весь оригинальный контейнер селектора
    // Это включает и сам селектор, и лейбл, которые могут быть видимыми
    const originalLabel = parentContainer.querySelector('label[for="api-source-selector"]');
    if (originalLabel) {
        originalLabel.style.display = 'none';
    }
    
    // Кроме того, скрываем сам селектор более агрессивно
    existingSelector.style.cssText = 'display: none !important; visibility: hidden !important; position: absolute !important; width: 0 !important; height: 0 !important; opacity: 0 !important;';
    
    // Создаем стилизованную кнопку-селектор
    const customSelector = document.createElement('button');
    customSelector.className = 'btn api-source-custom-selector';
    customSelector.innerHTML = `<i class="fas fa-server"></i> <span>${selectedOption ? selectedOption.textContent : 'Источник API'}</span> <i class="fas fa-chevron-down"></i>`;
    
    // Добавляем кнопку в контейнер
    parentContainer.appendChild(customSelector);
    
    // Удаляем все существующие выпадающие списки с таким же ID
    document.querySelectorAll('.api-source-dropdown').forEach(el => el.remove());
    
    // Создаем выпадающий список (но не добавляем на страницу пока)
    const dropdown = document.createElement('div');
    dropdown.className = 'api-source-dropdown';
    dropdown.style.display = 'none';
    
    // Заголовок выпадающего списка
    const dropdownHeader = document.createElement('div');
    dropdownHeader.className = 'dropdown-header';
    dropdownHeader.textContent = 'Выберите источник API';
    dropdown.appendChild(dropdownHeader);
    
    // Получаем доступные источники API
    const availableSources = getAvailableSources();
    const availableKeys = availableSources.map(source => source.key);
    
    // Добавляем элементы списка
    options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        if (option.selected) {
            item.classList.add('active');
        }
        
        // Проверяем доступность источника
        if (!availableKeys.includes(option.value)) {
            item.classList.add('disabled');
        }
        
        item.textContent = option.textContent;
        item.dataset.value = option.value;
        
        // Обработчик выбора источника
        item.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            // Меняем значение оригинального селектора, что вызывает его обработчик onChange
            existingSelector.value = this.dataset.value;
            
            // Создаем и вызываем событие изменения для оригинального селектора
            const event = new Event('change');
            existingSelector.dispatchEvent(event);
            
            // Обновляем текст кнопки
            customSelector.querySelector('span').textContent = this.textContent;
            
            // Закрываем выпадающий список
            dropdown.style.display = 'none';
        });
        
        dropdown.appendChild(item);
    });
    
    // Добавляем выпадающий список в DOM
    document.body.appendChild(dropdown);
    
    // Обработчик клика по кнопке
    customSelector.addEventListener('click', function(event) {
        event.stopPropagation();
        
        const isVisible = dropdown.style.display === 'block';
        
        // Скрываем все другие открытые выпадающие списки
        document.querySelectorAll('.api-source-dropdown').forEach(el => {
            el.style.display = 'none';
        });
        
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            // Позиционируем и показываем выпадающий список
            const rect = customSelector.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY}px`;
            dropdown.style.left = `${rect.left + window.scrollX}px`;
            dropdown.style.minWidth = `${rect.width}px`;
            dropdown.style.display = 'block';
        }
    });
    
    // Закрываем выпадающий список при клике вне его
    document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target) && event.target !== customSelector) {
            dropdown.style.display = 'none';
        }
    });
    
    // Обновляем селектор при изменении источника API
    existingSelector.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        customSelector.querySelector('span').textContent = selectedOption ? selectedOption.textContent : 'Источник API';
        
        // Обновляем активный элемент в выпадающем списке
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            if (item.dataset.value === this.value) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
}


// Экспорт дополнительных функций из ui.js для обратной совместимости
export { addHeaderRow, formatJsonBody };