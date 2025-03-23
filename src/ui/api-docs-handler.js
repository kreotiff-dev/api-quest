/**
 * Модуль для управления документацией API
 * @module ui/api-docs-handler
 */

import { getCurrentSourceInfo } from '../api/sources/index.js';

// Определяем URL документации для разных источников API
const apiDocsUrls = {
    mock: '/api-docs/mock.html',
    public: '/api-docs/public.html',
    custom: '/api-docs/custom.html'
};

/**
 * Обработчик клика по кнопке "Документация API"
 * Открывает документацию для текущего источника API
 */
export function setupApiDocsButton() {
    const openApiDocsButton = document.getElementById('open-api-docs');
    
    if (!openApiDocsButton) {
        console.warn('Кнопка "Документация API" не найдена');
        return;
    }
    
    openApiDocsButton.addEventListener('click', openApiDocumentation);
}

/**
 * Функция открытия документации API
 * @param {Event} event - Событие клика
 */
export function openApiDocumentation(event) {
    // Предотвращаем стандартное поведение ссылки, если это ссылка
    if (event) {
        event.preventDefault();
    }
    
    // Получаем информацию о текущем источнике API
    const currentSource = getCurrentSourceInfo();
    
    // Определяем URL документации в зависимости от источника
    const docsUrl = apiDocsUrls[currentSource.key] || apiDocsUrls.mock;
    
    // Вариант 1: Открываем документацию в новой вкладке
    // window.open(docsUrl, '_blank');
    
    // Вариант 2: Открываем документацию в том же окне
    window.location.href = docsUrl;
}

/**
 * Инициализация модуля
 */
export function init() {
    setupApiDocsButton();
    
    // Также можно добавить обработчик события изменения источника API,
    // чтобы динамически менять ссылку на документацию
    document.addEventListener('apiSourceChanged', updateApiDocsButtonUrl);
}

/**
 * Обновление URL кнопки документации при изменении источника API
 * @param {CustomEvent} event - Событие изменения источника API
 */
function updateApiDocsButtonUrl(event) {
    const openApiDocsButton = document.getElementById('open-api-docs');
    if (!openApiDocsButton) return;
    
    const sourceKey = event.detail?.source || 'mock';
    const docsUrl = apiDocsUrls[sourceKey] || apiDocsUrls.mock;
    
    // Если кнопка реализована как ссылка, обновляем href
    if (openApiDocsButton.tagName === 'A') {
        openApiDocsButton.href = docsUrl;
    }
}

export default {
    init,
    openApiDocumentation
};