/**
 * Модуль AI-ассистента для помощи в обучении
 * @module ai/assistant
 */

import { getCurrentTask } from '../app.js';
import { getResponse } from './responses.js';
import { emit, on } from '../core/events.js';
import { getConfigValue } from '../core/config.js';
import { getAnswerFromChatGpt } from './chatgpt-api.js';
import { ensureTooltips } from '../api/monitoring/tooltip-helper.js';

// Приватные переменные для модуля
let messageContainer = null;
let initialized = false;

on('screenChanged', (screenName) => {
    console.log('Обработчик screenChanged в ассистенте:', screenName);
    
    if (screenName === 'tasks') {
        // Если перешли на экран заданий, сбрасываем состояние ассистента
        resetAiAssistant();
    }
});

/**
 * Инициализация AI-ассистента
 */
export function initAiAssistant() {
    if (initialized) return;
    
    messageContainer = document.getElementById('ai-feedback-content');
    if (!messageContainer) {
        console.error('Не найден контейнер для сообщений AI-ассистента');
        return;
    }
    
    // Добавляем приветственное сообщение
    addAiMessage(getResponse('welcome'));
    
    // Добавляем обработчики событий для кнопок и поля ввода
    setupEventListeners();
    
    initialized = true;
    
    // Генерируем событие инициализации ассистента
    emit('aiAssistantInitialized');
    setTimeout(() => {
        ensureTooltips();
    }, 500);
}

// Объявление функции handleKeyPress для использования с addEventListener/removeEventListener
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendQuestion();
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Обработчик для кнопки "Помощь"
    document.getElementById('ai-help-btn')?.addEventListener('click', askHelp);
    
    // Обработчик для кнопки "Анализировать"
    document.getElementById('ai-analyze-btn')?.addEventListener('click', analyzeRequest);
    
    // Обработчик для кнопки отправки вопроса
    document.getElementById('ai-question-send')?.addEventListener('click', sendQuestion);
    
    // Обработчик для поля ввода (отправка по Enter)
    document.getElementById('ai-question-input')?.addEventListener('keypress', handleKeyPress);
}

/**
 * Добавление сообщения от AI-ассистента в чат
 * @param {string} message - Текст сообщения
 */
export function addAiMessage(message) {
    if (!messageContainer) {
        messageContainer = document.getElementById('ai-feedback-content');
        if (!messageContainer) return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message';
    messageElement.innerHTML = `<p>${message}</p>`;
    
    messageContainer.appendChild(messageElement);
    
    // Прокрутка к последнему сообщению
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    // Генерируем событие добавления сообщения
    emit('aiMessageAdded', { type: 'ai', message });
}

/**
 * Добавление сообщения пользователя в чат
 * @param {string} message - Текст сообщения
 */
export function addUserMessage(message) {
    if (!messageContainer) {
        messageContainer = document.getElementById('ai-feedback-content');
        if (!messageContainer) return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'user-message';
    messageElement.innerHTML = `<p>${message}</p>`;
    
    messageContainer.appendChild(messageElement);
    
    // Прокрутка к последнему сообщению
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    // Генерируем событие добавления сообщения
    emit('aiMessageAdded', { type: 'user', message });
}

/**
 * Сброс состояния AI-ассистента
 */
export function resetAiAssistant() {
    if (!initialized) return;
    
    initialized = false;
    messageContainer = null;

    document.getElementById('ai-help-btn')?.removeEventListener('click', askHelp);
    document.getElementById('ai-analyze-btn')?.removeEventListener('click', analyzeRequest);
    document.getElementById('ai-question-send')?.removeEventListener('click', sendQuestion);
    
    const inputElement = document.getElementById('ai-question-input');
    if (inputElement) {
        inputElement.removeEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendQuestion();
            }
        });
    }
    
    console.log('AI-ассистент сброшен');
}


/**
 * Помощь по текущему заданию
 */
export function askHelp() {
    const task = getCurrentTask();
    if (!task) return;
    
    // Добавляем сообщение пользователя
    addUserMessage("Помогите мне с этим заданием, пожалуйста.");
    
    // Генерируем ответ на основе данных задания
    let helpMessage = `<p>Конечно! Вот что нужно сделать в задании "${task.title}":</p>`;
    
    // Добавляем основную информацию о задании
    helpMessage += `<p>${task.description}</p>`;
    
    // Советы по методу запроса
    if (task.solution && task.solution.method) {
        helpMessage += `<p><strong>Метод запроса:</strong> ${task.solution.method}</p>`;
        helpMessage += `<p>${getResponse(`methodHelp.${task.solution.method}`)}</p>`;
    }
    
    // Советы по URL
    if (task.solution && task.solution.url) {
        helpMessage += `<p><strong>URL:</strong> ${task.solution.url}</p>`;
    }
    
    // Советы по заголовкам
    if (task.solution && task.solution.headers) {
        helpMessage += `<p><strong>Заголовки:</strong></p><ul>`;
        
        for (const headerName in task.solution.headers) {
            helpMessage += `<li>${headerName}`;
            if (getResponse(`headerHelp.${headerName}`, null, '')) {
                helpMessage += `: ${getResponse(`headerHelp.${headerName}`)}`;
            }
            helpMessage += `</li>`;
        }
        
        helpMessage += `</ul>`;
    }
    
    // Советы по телу запроса
    if (task.solution && task.solution.body && typeof task.solution.body === 'object') {
        helpMessage += `<p><strong>Тело запроса:</strong> Должно содержать следующие поля:</p><ul>`;
        
        for (const fieldName in task.solution.body) {
            helpMessage += `<li>${fieldName}</li>`;
        }
        
        helpMessage += `</ul>`;
    }
    
    // Информация об источниках API
    if (task.apiSourceRestrictions) {
        const sourcesInfo = task.apiSourceRestrictions.map(source => {
            return getResponse(`apiSources.${source}`, null, source);
        }).join(' или ');
        
        helpMessage += `<p><strong>Требуемый источник API:</strong> ${sourcesInfo}</p>`;
    }
    
    // Общие советы
    helpMessage += `<p><strong>Совет:</strong> ${getResponse('hints.general')}</p>`;
    
    // Задержка имитации "печатания" сообщения
    setTimeout(() => {
        // Добавляем ответ ассистента
        addAiMessage(helpMessage);
    }, 800);
}

/**
 * Анализ текущего запроса
 */
export async function analyzeRequest() {
    const task = getCurrentTask();
    if (!task) return;
    
    // Добавляем сообщение пользователя
    addUserMessage("Проанализируйте мой запрос, пожалуйста.");
    
    // Получаем данные текущего запроса
    const method = document.getElementById('request-method')?.value;
    const url = document.getElementById('request-url')?.value;
    
    if (!method || !url) {
        addAiMessage("Не могу проанализировать запрос, так как не заполнены основные поля (метод или URL).");
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
    let requestBody = "";
    let parsedBody = null;
    let bodyValid = true;
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestBody = document.getElementById('request-body')?.value.trim() || "";
        try {
            if (requestBody) {
                parsedBody = JSON.parse(requestBody);
            }
        } catch (e) {
            bodyValid = false;
        }
    }
    
    // Добавляем индикатор печатания
    const typingIndicator = addTypingIndicator();
    
    // Проверяем, есть ли ограничения на источники API для задания
    const currentSource = getCurrentSourceInfo();
    
    if (task.apiSourceRestrictions && !task.apiSourceRestrictions.includes(currentSource.key)) {
        // Задание требует другого источника API
        const sourcesInfo = task.apiSourceRestrictions.map(sourceKey => getResponse(`apiSources.${sourceKey}`, null, sourceKey)).join(' или ');
        
        const message = `<p>Обратите внимание: для этого задания требуется использовать следующий источник API: <strong>${sourcesInfo}</strong>.</p>
                        <p>Сейчас вы используете источник "${currentSource.name}". Пожалуйста, переключитесь на требуемый источник с помощью селектора источников API.</p>`;
        
        // Удаляем индикатор печатания
        setTimeout(() => {
            removeTypingIndicator(typingIndicator);
            addAiMessage(message);
        }, 800);
        
        // Не продолжаем анализ, так как источник API неправильный
        return;
    }
    
    try {
        // Проверяем, включен ли ChatGPT в настройках
        const chatGptEnabled = getConfigValue('chatgpt.enabled', true);
        
        if (chatGptEnabled) {
            // Формируем контекст запроса для передачи в ChatGPT
            const requestContext = {
                task,
                request: {
                    method,
                    url,
                    headers,
                    body: requestBody,
                    bodyValid
                },
                currentSource
            };
            
            // Формируем вопрос для ChatGPT
            const analysisQuestion = 
                `Проанализируй этот API-запрос и сравни его с требованиями задания:
                - Метод: ${method}
                - URL: ${url}
                - Заголовки: ${JSON.stringify(headers)}
                - Тело запроса: ${requestBody}
                - Валидность тела запроса: ${bodyValid ? 'корректный JSON' : 'некорректный JSON'}
                
                Сравни с требованиями задания и укажи все несоответствия. Если запрос соответствует требованиям, укажи это.`;
            
            // Получаем ответ от ChatGPT API
            const answer = await getAnswerFromChatGpt(analysisQuestion, requestContext);
            
            // Удаляем индикатор печатания
            removeTypingIndicator(typingIndicator);
            
            // Добавляем ответ в чат
            addAiMessage(answer);
        } else {
            // Используем стандартный анализ (существующий код)
            // Здесь можно оставить текущую логику анализа из оригинального файла
            // ...

            // Удаляем индикатор печатания через 1 секунду
            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                // Вызываем существующую функцию обработки
                processStandardAnalysis(task, method, url, headers, parsedBody, bodyValid);
            }, 1000);
        }
    } catch (error) {
        console.error('Ошибка при анализе запроса:', error);
        
        // Удаляем индикатор печатания
        removeTypingIndicator(typingIndicator);
        
        // Добавляем сообщение об ошибке
        addAiMessage(`<p>Извините, не удалось проанализировать ваш запрос. Попробуйте позже или сформулируйте запрос по-другому.</p>`);
    }
}

/**
 * Стандартный анализ запроса (без использования ChatGPT)
 * Это вспомогательная функция для упрощения кода
 */
function processStandardAnalysis(task, method, url, headers, requestBody, bodyValid) {
    // Анализируем запрос на соответствие заданию
    const issues = [];
    
    // Проверка метода
    if (task.solution && task.solution.method && method !== task.solution.method) {
        issues.push(`Используется метод ${method}, но для этого задания требуется ${task.solution.method}.`);
    }
    
    // Проверка URL
    if (task.solution && task.solution.url && url !== task.solution.url) {
        issues.push(`URL не соответствует заданию. Ожидается: ${task.solution.url}`);
    }
    
    // Проверка заголовков
    if (task.solution && task.solution.headers) {
        for (const [key, value] of Object.entries(task.solution.headers)) {
            if (!headers[key]) {
                issues.push(`Отсутствует заголовок ${key}.`);
            } else if (value !== true && value !== '' && headers[key] !== value) {
                issues.push(`Неверное значение заголовка ${key}.`);
            }
        }
    }
    
    // Проверка тела запроса
    if (!bodyValid && ['POST', 'PUT', 'PATCH'].includes(method)) {
        issues.push('Тело запроса содержит некорректный JSON.');
    } else if (task.solution && task.solution.body && typeof task.solution.body === 'object' && 
            ['POST', 'PUT', 'PATCH'].includes(method)) {
        for (const [key, value] of Object.entries(task.solution.body)) {
            if (!requestBody || requestBody[key] === undefined) {
                issues.push(`В теле запроса отсутствует обязательное поле ${key}.`);
            } else if (value !== true && requestBody[key] !== value) {
                issues.push(`Неверное значение поля ${key} в теле запроса.`);
            }
        }
    }
    
    // Формируем ответ на основе анализа
    let analysisMessage = '';
    
    if (issues.length === 0) {
        analysisMessage = `<p>${getResponse('analysisSuccess')}</p>`;
        
        // Добавляем рекомендации по дальнейшим действиям
        analysisMessage += '<p>Вы можете отправить запрос и проверить ответ сервера. Если ответ соответствует ожидаемому, нажмите кнопку "Проверить решение".</p>';
    } else {
        analysisMessage = `<p>${getResponse('analysisFailed')}</p><ul>`;
        
        for (const issue of issues) {
            analysisMessage += `<li>${issue}</li>`;
        }
        
        analysisMessage += '</ul>';
        
        // Добавляем рекомендации по исправлению
        analysisMessage += '<p>Исправьте указанные проблемы и попробуйте снова.</p>';
    }
    
    // Добавляем ответ ассистента
    addAiMessage(analysisMessage);
}

/**
 * Обработка пользовательского вопроса
 */
export async function sendQuestion() {
    const inputField = document.getElementById('ai-question-input');
    if (!inputField) return;
    
    const question = inputField.value.trim();
    
    if (!question) return;

    // Проверка тематики вопроса
    if (!isRelevantQuestion(question)) {
        addAiMessage("Я могу отвечать только на вопросы, связанные с API и тестированием. Пожалуйста, задайте вопрос по теме.");
        inputField.value = '';
        return;
    }
    
    // Добавляем вопрос пользователя в чат
    addUserMessage(question);
    
    // Очищаем поле ввода
    inputField.value = '';
    
    // Добавляем индикатор печатания
    const typingIndicator = addTypingIndicator();
    
    try {
        // Проверяем, включен ли ChatGPT в настройках
        const chatGptEnabled = getConfigValue('chatgpt.enabled', true);
        const minQuestionLength = getConfigValue('chatgpt.minQuestionLength', 15);
        
        // Если вопрос короткий или ChatGPT отключен, используем встроенные ответы
        if (!chatGptEnabled || question.length < minQuestionLength) {
            // Генерируем ответ на основе ключевых слов в вопросе
            const answer = generateAnswerFromKeywords(question);
            
            // Имитируем задержку "размышления" перед ответом
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Удаляем индикатор печатания
            removeTypingIndicator(typingIndicator);
            
            // Добавляем ответ в чат
            addAiMessage(answer);
        } else {
            // Получаем текущее задание для контекста
            const task = getCurrentTask();
            
            // Получаем ответ от ChatGPT API
            const answer = await getAnswerFromChatGpt(question, { task });
            
            // Удаляем индикатор печатания
            removeTypingIndicator(typingIndicator);
            
            // Добавляем ответ в чат
            addAiMessage(answer);
        }
    } catch (error) {
        console.error('Ошибка при обработке вопроса:', error);
        
        // Удаляем индикатор печатания
        removeTypingIndicator(typingIndicator);
        
        // Добавляем сообщение об ошибке
        addAiMessage(`<p>Извините, не удалось обработать ваш вопрос. Попробуйте позже или сформулируйте вопрос по-другому.</p>`);
    }
}

// Функция для проверки релевантности вопроса
function isRelevantQuestion(question) {
    // Флаг для включения/отключения проверки
    const enableRelevanceCheck = false; // Установите в true, чтобы включить проверку
    
    // Если проверка отключена, всегда возвращаем true
    if (!enableRelevanceCheck) {
        return true;
    }
    
    const lowerQuestion = question.toLowerCase();
    
    // Ключевые слова, связанные с API
    const relevantKeywords = [
        'api', 'апи', 'тестировать', 'запрос', 'метод', 'http', 'get', 'post', 'put', 'delete', 'patch',
        'заголовок', 'header', 'тело', 'body', 'json', 'rest', 'endpoint',
        'аутентификация', 'авторизация', 'токен', 'статус', 'код', 'тестирование',
        'url', 'параметр', 'запрос', 'ответ', 'сервер', 'клиент'
    ];
    
    // Проверяем, содержит ли вопрос хотя бы одно ключевое слово
    return relevantKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Добавление индикатора печатания в чат
 * @returns {HTMLElement} Элемент индикатора
 */
function addTypingIndicator() {
    if (!messageContainer) {
        messageContainer = document.getElementById('ai-feedback-content');
        if (!messageContainer) return null;
    }
    
    const indicatorElement = document.createElement('div');
    indicatorElement.className = 'ai-message typing-indicator';
    indicatorElement.innerHTML = `<p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>`;
    
    messageContainer.appendChild(indicatorElement);
    
    // Прокрутка к последнему сообщению
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    return indicatorElement;
}

/**
 * Удаление индикатора печатания из чата
 * @param {HTMLElement} indicator - Элемент индикатора
 */
function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

/**
 * Генерация ответа на основе ключевых слов
 * @param {string} question - Вопрос пользователя
 * @returns {string} Ответ ассистента
 */
function generateAnswerFromKeywords(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Проверяем наличие ключевых слов в вопросе
    if (lowerQuestion.includes('метод') || 
        lowerQuestion.includes('get') || 
        lowerQuestion.includes('post') || 
        lowerQuestion.includes('put') || 
        lowerQuestion.includes('delete') ||
        lowerQuestion.includes('patch')) {
        
        return '<p>Основные HTTP методы:</p><ul>' + 
            Object.entries(getResponse('methodHelp')).map(([method, description]) => 
                `<li><strong>${method}</strong>: ${description}</li>`
            ).join('') + 
            '</ul>';
    } 
    else if (lowerQuestion.includes('заголов') || lowerQuestion.includes('header')) {
        return '<p>Важные HTTP заголовки:</p><ul>' + 
            Object.entries(getResponse('headerHelp')).map(([header, description]) => 
                `<li><strong>${header}</strong>: ${description}</li>`
            ).join('') + 
            '</ul>';
    }
    else if (lowerQuestion.includes('статус') || lowerQuestion.includes('код') || lowerQuestion.includes('status') || lowerQuestion.includes('code')) {
        return '<p>Основные HTTP статус-коды:</p><ul>' + 
            Object.entries(getResponse('statusCodes')).map(([code, description]) => 
                `<li><strong>${code}</strong>: ${description}</li>`
            ).join('') + 
            '</ul>';
    }
    else if (lowerQuestion.includes('json') || lowerQuestion.includes('тело') || lowerQuestion.includes('body')) {
        return `<p>${getResponse('hints.json')}</p>
                <p>Пример JSON-тела запроса:</p>
                <pre>{\n  "name": "Иван Иванов",\n  "email": "ivan@example.com",\n  "role": "user"\n}</pre>`;
    }
    else if (lowerQuestion.includes('аутентификац') || lowerQuestion.includes('авториз') || lowerQuestion.includes('auth')) {
        return `<p>${getResponse('hints.auth')}</p>
                <p>Примеры аутентификации:</p>
                <ol>
                  <li>API-ключ: <code>X-API-Key: your_api_key_123</code></li>
                  <li>Bearer-токен: <code>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code></li>
                  <li>Basic-аутентификация: <code>Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=</code></li>
                </ol>`;
    }
    else if (lowerQuestion.includes('источник') || lowerQuestion.includes('api источник') || 
            lowerQuestion.includes('source')) {
        
        if (lowerQuestion.includes('симулятор') || lowerQuestion.includes('мок') || 
            lowerQuestion.includes('mock')) {
            return getResponse('apiSources.mock');
        }
        else if (lowerQuestion.includes('публичн') || lowerQuestion.includes('public')) {
            return getResponse('apiSources.public');
        }
        else if (lowerQuestion.includes('учебн') || lowerQuestion.includes('custom')) {
            return getResponse('apiSources.custom');
        }
        else if (lowerQuestion.includes('выбра') || lowerQuestion.includes('переключ') || 
                lowerQuestion.includes('селектор')) {
            return getResponse('sourceSelection');
        }
        else if (lowerQuestion.includes('сравн') || lowerQuestion.includes('разниц') || 
                lowerQuestion.includes('различ')) {
            return getResponse('sourceComparison');
        }
        else if (lowerQuestion.includes('проблем') || lowerQuestion.includes('ошибк') || 
                lowerQuestion.includes('не работа')) {
            return getResponse('troubleshooting');
        }
        else {
            // Общая информация об источниках API
            return `<p>В API-Quest доступны три источника API:</p>
                   <ul>
                     <li><strong>Симулятор API</strong>: ${getResponse('apiSources.mock')}</li>
                     <li><strong>Публичные API</strong>: ${getResponse('apiSources.public')}</li>
                     <li><strong>Учебный API</strong>: ${getResponse('apiSources.custom')}</li>
                   </ul>
                   <p>${getResponse('sourceSelection')}</p>`;
        }
    }
    else {
        // Общий ответ, если не нашли конкретную тему
        const task = getCurrentTask();
        
        if (task) {
            return `<p>Для выполнения задания "${task.title}" вам необходимо:</p>
                   <ol>
                     <li>Использовать правильный HTTP-метод</li>
                     <li>Указать корректный URL</li>
                     <li>Добавить необходимые заголовки</li>
                     <li>Сформировать правильное тело запроса (для POST/PUT/PATCH)</li>
                   </ol>
                   <p>Проверьте требования задания и попробуйте отправить запрос. Если будут ошибки, вы можете попросить меня проанализировать ваш запрос.</p>`;
        } else {
            return "Извините, я не могу ответить на этот вопрос. Попробуйте задать более конкретный вопрос, связанный с API или текущим заданием.";
        }
    }
}

// Вспомогательные функции и обработчики
function getCurrentSourceInfo() {
    // Временное решение - в будущем будет заменено на импорт из модуля источников API
    return window.ApiSourceManager?.getCurrentSourceInfo() || { key: 'mock', name: 'Симулятор API' };
}

function getAvailableSources() {
    // Временное решение - в будущем будет заменено на импорт из модуля источников API
    return window.ApiSourceManager?.getAvailableSources() || [];
}

// Экспортируем публичный API модуля
export default {
    initAiAssistant,
    addAiMessage,
    addUserMessage,
    askHelp,
    analyzeRequest,
    sendQuestion,
    resetAiAssistant
};