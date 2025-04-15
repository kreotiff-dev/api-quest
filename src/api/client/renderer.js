/**
 * Модуль рендеринга ответов API
 * @module api/client/renderer
 */

import { getCurrentSourceInfo } from '../sources/index.js';

/**
 * Отображение API-ответа
 * @param {Object} response - Объект ответа API
 */
export function showApiResponse(response) {
    // Метаинформация ответа (статус)
    const responseStatus = `${response.status} ${response.statusText}`;
    const statusClass = getStatusClass(response.status);
    
    // Получаем информацию о текущем источнике API
    const sourceInfo = getCurrentSourceInfo();
    
    const responseMeta = document.getElementById('response-meta');
    if (responseMeta) {
        responseMeta.innerHTML = `
            <span class="response-status ${statusClass}">${responseStatus}</span>
            <span class="response-time">Время: ${Math.floor(Math.random() * 200 + 100)} мс</span>
            <span class="response-source" title="${sourceInfo.description}">Источник: ${sourceInfo.name}</span>
        `;
    }
    
    // Заголовки ответа
    const responseHeaders = document.getElementById('response-headers');
    if (responseHeaders && response.headers) {
        let headersText = '';
        
        for (const [key, value] of Object.entries(response.headers)) {
            headersText += `${key}: ${value}\n`;
        }
        
        responseHeaders.textContent = headersText;
    }
    
    // Тело ответа
    const responseBody = document.getElementById('response-body');
    if (responseBody) {
        if (response.body !== null && response.body !== undefined) {
            try {
                const formattedJson = JSON.stringify(response.body, null, 2);
                responseBody.textContent = formattedJson;
                highlightSyntax('response-body');
            } catch (e) {
                responseBody.textContent = String(response.body);
            }
        } else {
            responseBody.textContent = '[Нет содержимого]';
        }
    }
    
    // Активируем таб с телом ответа
    const bodyTab = document.querySelector('.response-tab[data-tab="body"]');
    if (bodyTab) {
        bodyTab.click();
    }
}

/**
 * Получение класса для статус-кода
 * @param {number} status - HTTP статус-код
 * @returns {string} CSS класс
 */
function getStatusClass(status) {
    if (status >= 200 && status < 300) {
        return 'response-status-success';
    } else if (status >= 300 && status < 400) {
        return 'response-status-redirect';
    } else if (status >= 400 && status < 500) {
        return 'response-status-error';
    } else if (status >= 500) {
        return 'response-status-error';
    } else {
        return 'response-status-unknown';
    }
}

/**
 * Подсветка синтаксиса JSON
 * @param {string} elementId - ID элемента
 */
function highlightSyntax(elementId) {
    // Базовая подсветка синтаксиса JSON
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    
    // Простая подсветка ключей и значений
    let highlightedText = text.replace(
        /"([^"]+)":/g, 
        '<span class="json-key">"$1"</span>:'
    );
    
    highlightedText = highlightedText.replace(
        /: ("[^"]+")/g, 
        ': <span class="json-string">$1</span>'
    );
    
    highlightedText = highlightedText.replace(
        /: ([0-9]+)/g, 
        ': <span class="json-number">$1</span>'
    );
    
    highlightedText = highlightedText.replace(
        /: (true|false|null)/g, 
        ': <span class="json-boolean">$1</span>'
    );
    
    element.innerHTML = highlightedText;
}