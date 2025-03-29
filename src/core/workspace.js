/**
 * Модуль управления рабочей областью задания
 * @module core/workspace
 */

import { getTaskById, getDifficultyText, getCategoryText } from '../data/tasks.js';
import { getUserProgress, updateTaskAttempt, markTaskAsCompleted, getSavedSolution, saveSolution } from '../data/user-progress.js';
import { getCurrentTask } from '../app.js';
import { showNotification } from '../ui/notifications.js';
import { createDynamicModal } from '../ui/index.js';
import { addHeaderRow, resetResponse } from '../api/client/ui.js';
import { emit } from './events.js';
import { sendRequest, getCurrentSourceInfo } from '../api/sources/index.js';

/**
 * Настройка рабочей области для задания
 * @param {Object} task - Задание
 */
export function setupTaskWorkspace(task) {
    if (!task) {
        console.error('Задание не указано');
        return;
    }
    
    // Заполнение данных задания
    document.getElementById('task-title').textContent = task.title;
    document.getElementById('task-subtitle').textContent = task.subtitle;
    document.getElementById('task-category').innerHTML = `Категория: <strong>${getCategoryText(task.category)}</strong>`;
    document.getElementById('task-difficulty').innerHTML = `Сложность: <strong>${getDifficultyText(task.difficulty)}</strong>`;
    document.getElementById('task-description').innerHTML = `<h3>Описание задания</h3><p>${task.description}</p>`;
    
    // Заполнение требований
    const requirementsList = document.querySelector('.requirements-list');
    if (requirementsList) {
        requirementsList.innerHTML = '';
        
        task.requirements.forEach(req => {
            const reqItem = document.createElement('div');
            reqItem.className = 'requirement-item';
            reqItem.innerHTML = `<i class="fas fa-check-circle"></i><span>${req}</span>`;
            requirementsList.appendChild(reqItem);
        });
    }
    
    // Заполнение ожидаемого результата
    const expectedResult = document.getElementById('task-expected-result');
    if (expectedResult) {
        expectedResult.innerHTML = `<h3>Ожидаемый результат</h3><p>${task.expectedResult}</p>`;
    }
    
    // Настройка интерфейса API-клиента
    setupApiClientInterface(task);
    
    // Обновляем информацию о доступных источниках API
    updateApiSourcesInfo(task);
    
    // Обновляем прогресс задания
    updateTaskProgressUI(task.id);
    
    // Проверяем наличие сохраненного решения
    loadSavedSolution(task.id);
    
    // Генерируем событие настройки рабочей области
    emit('workspaceSetup', task);
}

/**
 * Обновление информации о доступных источниках API
 * @param {Object} task - Задание
 */
export function updateApiSourcesInfo(task) {
    // Проверяем, есть ли у задания ограничения на источники API
    if (task.apiSourceRestrictions) {
        // Если есть ограничения, показываем соответствующее уведомление
        const currentSource = getCurrentSourceInfo();
        
        if (task.apiSourceRestrictions.includes(currentSource.key)) {
            // Текущий источник разрешен, все в порядке
        } else {
            // Текущий источник не разрешен, переключаемся на подходящий
            const availableSources = task.apiSourceRestrictions.filter(source => 
                getAvailableSources().some(s => s.key === source)
            );
            
            if (availableSources.length > 0) {
                setApiSource(availableSources[0]);
                showNotification(`Для этого задания требуется использовать источник "${getCurrentSourceInfo().name}"`, 'info');
            } else {
                showNotification('Внимание: для этого задания нет доступных API-источников. Используется симулятор.', 'warning');
                setApiSource('mock');
            }
        }
    }
    
    // Добавляем информацию о рекомендуемых источниках API в описание задания, если она указана
    if (task.recommendedApiSource) {
        const sourceInfo = task.recommendedApiSource;
        const recommendationEl = document.createElement('div');
        recommendationEl.className = 'api-source-recommendation';
        recommendationEl.innerHTML = `
            <p><i class="fas fa-info-circle"></i> <strong>Рекомендуемый источник API:</strong> ${sourceInfo.name}</p>
            <p>${sourceInfo.description}</p>
        `;
        
        // Добавляем рекомендацию после описания задания
        const taskDescription = document.getElementById('task-description');
        if (taskDescription) {
            taskDescription.appendChild(recommendationEl);
        }
    }
}

/**
 * Настройка интерфейса API-клиента для задания
 * @param {Object} task - Задание
 */
export function setupApiClientInterface(task) {
    // Установка метода запроса
    if (task.solution && task.solution.method) {
        const methodSelect = document.getElementById('request-method');
        if (methodSelect) {
            methodSelect.value = task.solution.method;
        }
    }
    
    // Установка URL запроса
    if (task.solution && task.solution.url) {
        const urlInput = document.getElementById('request-url');
        if (urlInput) {
            urlInput.value = task.solution.url;
        }
    }
    
    // Очистка заголовков
    const headersContainer = document.getElementById('headers-container');
    if (headersContainer) {
        headersContainer.innerHTML = '';
    }
    
    // Добавление заголовков из решения, если они есть
    if (task.solution && task.solution.headers) {
        for (const [key, value] of Object.entries(task.solution.headers)) {
            addHeaderRow(key, ''); // Значение оставляем пустым, пользователь должен его ввести
        }
    } else {
        // Добавление пустого заголовка
        addHeaderRow();
    }
    
    // Установка тела запроса
    const requestBody = document.getElementById('request-body');
    if (requestBody) {
        if (task.solution && task.solution.body) {
            if (typeof task.solution.body === 'object') {
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
            } else if (typeof task.solution.body === 'string') {
                requestBody.value = task.solution.body;
            }
        } else {
            requestBody.value = '';
        }
    }
    
    // Сброс полей ответа
    resetResponse();
    
    // Обновляем интерфейс в зависимости от метода запроса
    updateUIForMethod(task.solution?.method || 'GET');
    
    // Проверяем, есть ли ограничения на источники API для этого задания
    if (task.apiSourceRestrictions) {
        // Отключаем селектор источников, если для задания разрешен только один источник
        const selector = document.getElementById('api-source-selector');
        if (selector && task.apiSourceRestrictions.length === 1) {
            selector.disabled = true;
            selector.title = 'Для этого задания разрешен только этот источник API';
        } else if (selector) {
            selector.disabled = false;
            selector.title = '';
        }
    }
}

/**
 * Обновление интерфейса в зависимости от метода запроса
 * @param {string} method - HTTP метод
 */
export function updateUIForMethod(method) {
    const requestBody = document.getElementById('request-body')?.parentElement;
    if (!requestBody) return;
    
    // Скрываем/показываем редактор тела запроса в зависимости от метода
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestBody.style.display = 'block';
    } else {
        requestBody.style.display = 'none';
    }
    
    // Добавляем автоматически заголовок Content-Type для методов с телом запроса
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const headersContainer = document.getElementById('headers-container');
        if (headersContainer) {
            const contentTypeExists = Array.from(headersContainer.querySelectorAll('.header-key')).some(input => 
                input.value.toLowerCase() === 'content-type');
            
            if (!contentTypeExists) {
                const contentTypeValue = document.getElementById('request-content-type')?.value || 'application/json';
                addHeaderRow('Content-Type', contentTypeValue);
            }
        }
    }
}

/**
 * Обновление отображения прогресса задания
 * @param {number} taskId - ID задания
 */
export function updateTaskProgressUI(taskId) {
    const userProgress = getUserProgress();
    const progress = userProgress.taskProgress[taskId] || 0;
    
    const progressElement = document.getElementById('task-progress');
    const progressBarElement = document.getElementById('task-progress-bar');
    
    if (progressElement) {
        progressElement.textContent = `${progress}%`;
    }
    
    if (progressBarElement) {
        progressBarElement.style.width = `${progress}%`;
    }
}

/**
 * Загрузка сохраненного решения
 * @param {number} taskId - ID задания
 */
export function loadSavedSolution(taskId) {
    const solution = getSavedSolution(taskId);
    
    if (solution) {
        // Устанавливаем URL
        if (solution.url) {
            const urlInput = document.getElementById('request-url');
            if (urlInput) {
                urlInput.value = solution.url;
            }
        }
        
        // Устанавливаем метод
        if (solution.method) {
            const methodSelect = document.getElementById('request-method');
            if (methodSelect) {
                methodSelect.value = solution.method;
            }
        }
        
        // Устанавливаем заголовки
        if (solution.headers) {
            const headersContainer = document.getElementById('headers-container');
            if (headersContainer) {
                headersContainer.innerHTML = '';
                
                for (const [key, value] of Object.entries(solution.headers)) {
                    addHeaderRow(key, value);
                }
            }
        }
        
        // Устанавливаем тело запроса
        if (solution.body) {
            const requestBody = document.getElementById('request-body');
            if (requestBody) {
                if (typeof solution.body === 'object') {
                    requestBody.value = JSON.stringify(solution.body, null, 2);
                } else if (typeof solution.body === 'string') {
                    requestBody.value = solution.body;
                }
            }
        }
        
        // Обновляем интерфейс в зависимости от метода
        updateUIForMethod(solution.method || 'GET');
    }
}

/**
 * Сохранение текущего решения задания
 */
export function saveCurrentSolution() {
    const task = getCurrentTask();
    if (!task) return;
    
    // Получаем данные текущего запроса
    const method = document.getElementById('request-method')?.value;
    const url = document.getElementById('request-url')?.value;
    
    if (!method || !url) return;
    
    // Сбор заголовков
    const headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        const key = row.querySelector('.header-key')?.value.trim();
        const value = row.querySelector('.header-value')?.value.trim();
        
        if (key && value) {
            headers[key] = value;
        }
    });
    
    // Получение тела запроса
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            const bodyText = document.getElementById('request-body')?.value.trim();
            if (bodyText) {
                body = JSON.parse(bodyText);
            }
        } catch (e) {
            console.error('Ошибка при сохранении тела запроса:', e);
        }
    }
    
    // Сохраняем решение
    saveSolution(task.id, { url, method, headers, body });
}

/**
 * Проверка выполнения задания
 */
export function checkTaskCompletion() {
    // Проверяем, активна ли вкладка "Проверка"
    const verificationTab = document.querySelector('.api-tab[data-tab="verification"]');
    const isVerificationTabActive = verificationTab && verificationTab.classList.contains('active');

    if (isVerificationTabActive) {
        // Если активна вкладка "Проверка", используем проверку из модуля verification
        import('../verification/index.js').then(module => {
            module.default.checkAnswer();
        }).catch(error => {
            console.error('Ошибка при загрузке модуля verification:', error);
            showNotification('Ошибка при проверке ответа. Пожалуйста, попробуйте еще раз.', 'error');
        });
        return; // Выходим из функции, так как проверка будет выполнена модулем verification
    }

    const task = getCurrentTask();
    if (!task) return;
    
    // Получение данных текущего запроса
    const method = document.getElementById('request-method')?.value;
    const url = document.getElementById('request-url')?.value;
    
    if (!method || !url) {
        showNotification('Заполните все обязательные поля запроса', 'error');
        return;
    }
    
    // Сбор заголовков
    const headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        const key = row.querySelector('.header-key')?.value.trim();
        const value = row.querySelector('.header-value')?.value.trim();
        
        if (key && value) {
            headers[key] = value;
        }
    });
    
    // Получение тела запроса
    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            const bodyText = document.getElementById('request-body')?.value.trim();
            if (bodyText) {
                requestBody = JSON.parse(bodyText);
            }
        } catch (e) {
            showNotification('Ошибка в формате JSON тела запроса', 'error');
            return;
        }
    }
    
    // Формируем запрос для проверки
    const request = {
        method,
        url,
        headers,
        body: requestBody
    };
    
    // Проверяем, было ли выполнено задание с использованием правильного источника API
    const currentSource = getCurrentSourceInfo();
    
    if (task.apiSourceRestrictions && !task.apiSourceRestrictions.includes(currentSource.key)) {
        showNotification(`Для этого задания требуется использовать определенный источник API: ${task.apiSourceRestrictions.join(' или ')}`, 'error');
        return;
    }
    
    // Проверка правильности запроса
    const isCorrect = checkRequestCorrectness(task, request);
    
    if (isCorrect) {
        // Дополнительная проверка ответа сервера, если требуется
        if (task.requiresServerResponse) {
            // Отправляем запрос и проверяем ответ
            showNotification('Отправка запроса для проверки решения...', 'info');
            
            sendRequest(request)
                .then(response => {
                    // Проверяем ответ на соответствие ожидаемому
                    const isResponseCorrect = checkResponseCorrectness(task, response);
                    
                    if (isResponseCorrect) {
                        // Обновление статуса задания на "выполнено"
                        const result = markTaskAsCompleted(task.id, getAllTasks());
                        
                        // Показываем уведомление об успешном выполнении
                        showNotification('Поздравляем! Задание выполнено успешно.', 'success');
                        
                        // Генерируем событие проверки задания
                        emit('taskCheckSuccess', { task, result });
                    } else {
                        showNotification('Ответ сервера не соответствует ожидаемому. Проверьте ваш запрос.', 'error');
                        
                        // Генерируем событие неудачной проверки
                        emit('taskCheckFailed', { task, response });
                    }
                })
                .catch(error => {
                    showNotification('Произошла ошибка при проверке решения: ' + error.message, 'error');
                    
                    // Генерируем событие ошибки
                    emit('taskCheckError', { task, error });
                });
        } else {
            // Обновление статуса задания на "выполнено" без проверки ответа
            const result = markTaskAsCompleted(task.id, getAllTasks());
            
            // Показываем уведомление об успешном выполнении
            showNotification('Поздравляем! Задание выполнено успешно.', 'success');
            
            // Генерируем событие проверки задания
            emit('taskCheckSuccess', { task, result });
        }
    } else {
        showNotification('Запрос не соответствует требованиям задания. Попробуйте еще раз.', 'error');
        
        // Генерируем событие неудачной проверки
        emit('taskCheckFailed', { task, request });
    }
}

/**
 * Проверка правильности запроса
 * @param {Object} task - Задание
 * @param {Object} request - Запрос
 * @returns {boolean} Результат проверки
 */
export function checkRequestCorrectness(task, request) {
    // Проверка метода
    if (task.solution && task.solution.method && request.method !== task.solution.method) {
        return false;
    }
    
    // Проверка URL
    if (task.solution && task.solution.url && request.url !== task.solution.url) {
        return false;
    }
    
    // Проверка обязательных заголовков
    if (task.solution && task.solution.headers) {
        for (const [key, value] of Object.entries(task.solution.headers)) {
            if (!request.headers[key]) {
                return false;
            }
            
            // Если для заголовка задано конкретное значение (не placeholder), проверяем его
            if (value !== true && value !== '' && request.headers[key] !== value) {
                return false;
            }
        }
    }
    
    // Проверка обязательных полей в теле запроса
    if (task.solution && task.solution.body && typeof task.solution.body === 'object' && 
        ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        for (const [key, value] of Object.entries(task.solution.body)) {
            if (!request.body || request.body[key] === undefined) {
                return false;
            }
            
            // Если задано конкретное значение (не placeholder), проверяем его
            if (value !== true && request.body[key] !== value) {
                return false;
            }
        }
    }
    
    // Для сложных задач с несколькими шагами
    if (task.solution && task.solution.steps) {
        // Здесь можно добавить дополнительную логику проверки
        // Например, сравнение с сохраненными ответами и т.д.
    }
    
    // Если все проверки пройдены, запрос считается правильным
    return true;
}

/**
 * Проверка правильности ответа сервера
 * @param {Object} task - Задание
 * @param {Object} response - Ответ сервера
 * @returns {boolean} Результат проверки
 */
export function checkResponseCorrectness(task, response) {
    // Если нет ожидаемого ответа, считаем любой ответ правильным
    if (!task.expectedResponse) {
        return true;
    }
    
    // Проверка статус-кода
    if (task.expectedResponse.status && response.status !== task.expectedResponse.status) {
        return false;
    }
    
    // Проверка заголовков
    if (task.expectedResponse.headers) {
        for (const [key, value] of Object.entries(task.expectedResponse.headers)) {
            if (!response.headers[key] || response.headers[key] !== value) {
                return false;
            }
        }
    }
    
    // Проверка тела ответа
    if (task.expectedResponse.body) {
        // Для простых проверок - полное соответствие
        if (task.expectedResponse.exactMatch) {
            return JSON.stringify(response.body) === JSON.stringify(task.expectedResponse.body);
        }
        
        // Для проверки по ключам
        if (typeof task.expectedResponse.body === 'object') {
            for (const [key, value] of Object.entries(task.expectedResponse.body)) {
                // Рекурсивная проверка по вложенным путям, например 'user.name'
                const checkNestedValue = (obj, path, expectedValue) => {
                    const keys = path.split('.');
                    let current = obj;
                    
                    for (let i = 0; i < keys.length; i++) {
                        if (current[keys[i]] === undefined) {
                            return false;
                        }
                        current = current[keys[i]];
                    }
                    
                    return current === expectedValue || 
                           (expectedValue === true && current !== undefined);
                };
                
                if (!checkNestedValue(response.body, key, value)) {
                    return false;
                }
            }
        }
    }
    
    // Если все проверки пройдены, ответ считается правильным
    return true;
}

/**
 * Получение подсказки по заданию
 */
export function getHint() {
    const task = getCurrentTask();
    if (!task) return;
    
    let hintContent = '';
    
    // Если у задания есть подсказки, показываем их
    if (task.hints && task.hints.length > 0) {
        // Определяем, какую подсказку показать (в зависимости от прогресса)
        const progress = getUserProgress().taskProgress[task.id] || 0;
        const hintIndex = Math.min(Math.floor(progress / 30), task.hints.length - 1);
        
        hintContent = task.hints[hintIndex];
    } else {
        // Генерируем общую подсказку на основе решения
        hintContent = generateGenericHint(task);
    }
    
    // Показываем модальное окно с подсказкой
    createDynamicModal('Подсказка', `<div class="hint-content">${hintContent}</div>`);
}

/**
 * Генерация общей подсказки на основе решения
 * @param {Object} task - Задание
 * @returns {string} HTML-разметка подсказки
 */
export function generateGenericHint(task) {
    let hint = '<p>Для этого задания обратите внимание на следующие моменты:</p><ul>';
    
    if (task.solution) {
        if (task.solution.method) {
            hint += `<li>Используйте метод <strong>${task.solution.method}</strong></li>`;
        }
        
        if (task.solution.url) {
            hint += `<li>URL должен быть <strong>${task.solution.url}</strong></li>`;
        }
        
        if (task.solution.headers) {
            hint += '<li>Не забудьте добавить необходимые заголовки</li>';
        }
        
        if (task.solution.body && ['POST', 'PUT', 'PATCH'].includes(task.solution.method)) {
            hint += '<li>Проверьте, что все необходимые поля присутствуют в теле запроса</li>';
        }
    }
    
    // Добавляем подсказку о выборе источника API, если есть ограничения
    if (task.apiSourceRestrictions) {
        const sourcesInfo = task.apiSourceRestrictions.map(sourceKey => {
            const source = getAvailableSources().find(s => s.key === sourceKey);
            return source ? source.name : sourceKey;
        }).join(' или ');
        
        hint += `<li>Для этого задания требуется использовать источник API: <strong>${sourcesInfo}</strong></li>`;
    }
    
    hint += '</ul><p>Внимательно прочитайте описание задания и требования.</p>';
    
    return hint;
}

export default {
    setupTaskWorkspace,
    setupApiClientInterface,
    updateUIForMethod,
    updateTaskProgressUI,
    loadSavedSolution,
    saveCurrentSolution,
    checkTaskCompletion,
    checkRequestCorrectness,
    checkResponseCorrectness,
    getHint,
    generateGenericHint
};