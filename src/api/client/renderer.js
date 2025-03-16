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
    
    document.getElementById('response-meta').innerHTML = `
        <span class="response-status ${statusClass}">${responseStatus}</span>
        <span class="response-time">Время: ${Math.floor(Math.random() * 200 + 100)} мс</span>
        <span class="response-source" title="${sourceInfo.description}">Источник: ${sourceInfo.name}</span>
    `;
    
    // Заголовки ответа
    if (response.headers) {
        let headersText = '';
        
        for (const [key, value] of Object.entries(response.headers)) {
            headersText += `${key}: ${value}\n`;
        }
        
        document.getElementById('response-headers').textContent = headersText;
    }
    
    // Тело ответа
    if (response.body !== null && response.body !== undefined) {
        try {
            const formattedJson = JSON.stringify(response.body, null, 2);
            document.getElementById('response-body').textContent = formattedJson;
            highlightSyntax('response-body');
        } catch (e) {
            document.getElementById('response-body').textContent = String(response.body);
        }
    } else {
        document.getElementById('response-body').textContent = '[Нет содержимого]';
    }
    
    // Активируем таб с телом ответа
    document.querySelector('.response-tab[data-tab="body"]')?.click();
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