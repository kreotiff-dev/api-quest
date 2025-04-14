/**
 * Модуль для работы с ChatGPT API
 * @module ai/chatgpt-api
 */

import { getConfigValue } from '../core/config.js';

// Константы для API
const API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';

/**
 * Отправляет запрос к ChatGPT API через серверный прокси
 * @param {Array<Object>} messages - Массив сообщений для отправки
 * @param {Object} options - Дополнительные опции запроса
 * @returns {Promise<Object>} Ответ от API
 */
export async function sendChatGptRequest(messages, options = {}) {
    try {
        // Используем серверный прокси вместо прямого вызова OpenAI API
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                messages: messages,
                options: {
                    model: options.model || DEFAULT_MODEL,
                    temperature: options.temperature || 0.7,
                    maxTokens: options.maxTokens || 500,
                    topP: options.topP || 1,
                    frequencyPenalty: options.frequencyPenalty || 0,
                    presencePenalty: options.presencePenalty || 0,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Ошибка API (${response.status}): ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        return data.data; // Данные вложены в свойство data
    } catch (error) {
        console.error('Ошибка при обращении к ChatGPT API:', error);
        throw error;
    }
}

/**
 * Получает ответ от ChatGPT на заданный вопрос
 * @param {string} question - Вопрос пользователя
 * @param {Object} context - Контекстная информация (текущее задание, история и т.д.)
 * @returns {Promise<string>} HTML-форматированный ответ
 */
export async function getAnswerFromChatGpt(question, context = {}) {
    // Формируем системное сообщение с контекстом
    const systemMessage = createSystemMessage(context);
    
    // Формируем массив сообщений
    const messages = [
        { role: "system", content: systemMessage },
        { role: "user", content: question }
    ];
    
    try {
        const response = await sendChatGptRequest(messages);
        const answer = response.choices[0].message.content;
        
        // Форматируем ответ для отображения в HTML
        return formatAnswerToHtml(answer);
    } catch (error) {
        console.error('Не удалось получить ответ от ChatGPT:', error);
        return `<p>Извините, не удалось получить ответ от ИИ-помощника. Попробуйте позже или обратитесь к документации.</p>
                <p><em>Техническая ошибка: ${error.message}</em></p>`;
    }
}

/**
 * Создает системное сообщение с контекстом для ChatGPT
 * @param {Object} context - Контекстная информация
 * @returns {string} Системное сообщение
 */
function createSystemMessage(context) {
    const { task } = context;
    
    let systemMessage = `Ты - ИИ-ассистент образовательной платформы API-Quest для обучения тестированию API.
Твоя задача - помогать пользователям понимать API, HTTP-запросы и решать задания по тестированию API.
Отвечай кратко, информативно и учебно, фокусируясь на практических аспектах работы с API.
ВАЖНО: Ты должен отвечать ТОЛЬКО на вопросы, связанные с API, HTTP, тестированием и программированием.
Если вопрос не связан с этими темами, вежливо откажись отвечать и напомни, что твоя область экспертизы ограничена темами API и тестированием.

Вот основные темы, по которым ты должен помогать:
1. HTTP-методы (GET, POST, PUT, PATCH, DELETE)
2. Заголовки HTTP
3. Структура API-запросов
4. Форматы данных (JSON, XML)
5. Коды статуса HTTP
6. Аутентификация и авторизация в API
7. Работа с API-клиентами`;

    // Если есть информация о текущем задании, добавляем ее
    if (task) {
        systemMessage += `\n\nПользователь сейчас работает над заданием: "${task.title}"
Описание задания: ${task.description}
`;

        if (task.solution) {
            systemMessage += `\nДля решения этого задания нужно:`;
            
            if (task.solution.method) {
                systemMessage += `\n- Использовать метод: ${task.solution.method}`;
            }
            
            if (task.solution.url) {
                systemMessage += `\n- Использовать URL: ${task.solution.url}`;
            }
            
            if (task.solution.headers) {
                systemMessage += `\n- Добавить заголовки: ${JSON.stringify(task.solution.headers)}`;
            }
            
            if (task.solution.body) {
                systemMessage += `\n- Тело запроса должно содержать: ${JSON.stringify(task.solution.body)}`;
            }
        }
        
        if (task.apiSourceRestrictions) {
            systemMessage += `\n- Для этого задания требуется использовать источник API: ${task.apiSourceRestrictions.join(' или ')}`;
        }
    }

    systemMessage += `\n\nФорматируй ответы так, чтобы их было легко читать. При необходимости используй HTML-теги (<p>, <ul>, <li>, <code>, <pre>, <strong>) для лучшего форматирования.`;
    
    return systemMessage;
}

/**
 * Форматирует текстовый ответ в HTML для отображения в чате
 * @param {string} text - Текстовый ответ
 * @returns {string} HTML-форматированный ответ
 */
function formatAnswerToHtml(text) {
    // Если ответ уже содержит HTML-теги, возвращаем как есть
    if (/<\/?[a-z][\s\S]*>/i.test(text)) {
        return text;
    }
    
    // Иначе форматируем текст
    let html = '';
    
    // Разделяем текст на абзацы
    const paragraphs = text.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
        // Обрабатываем списки
        if (paragraph.match(/^[*-]\s/m)) {
            html += '<ul>';
            const items = paragraph.split(/\n/);
            for (const item of items) {
                const trimmedItem = item.trim();
                if (trimmedItem.match(/^[*-]\s/)) {
                    html += `<li>${trimmedItem.replace(/^[*-]\s/, '')}</li>`;
                }
            }
            html += '</ul>';
        } 
        // Обрабатываем нумерованные списки
        else if (paragraph.match(/^\d+\.\s/m)) {
            html += '<ol>';
            const items = paragraph.split(/\n/);
            for (const item of items) {
                const trimmedItem = item.trim();
                if (trimmedItem.match(/^\d+\.\s/)) {
                    html += `<li>${trimmedItem.replace(/^\d+\.\s/, '')}</li>`;
                }
            }
            html += '</ol>';
        } 
        // Обрабатываем код
        else if (paragraph.match(/^```/)) {
            const code = paragraph.replace(/^```(\w+)?\n/, '').replace(/```$/, '');
            html += `<pre><code>${code}</code></pre>`;
        }
        // Обычный параграф
        else {
            const lines = paragraph.split('\n');
            html += `<p>${lines.join('<br>')}</p>`;
        }
    }
    
    // Форматируем инлайн-элементы
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return html;
}

export default {
    sendChatGptRequest,
    getAnswerFromChatGpt
};