/**
 * UI-компоненты для API-клиента
 * @module api/client/ui
 */

import { switchApiSource, toggleSourceSelector } from './index.js';
import { getCurrentSourceInfo, getAvailableSources } from '../sources/index.js';

/**
 * Создание строки заголовка
 * @param {string} key - Ключ заголовка
 * @param {string} value - Значение заголовка
 * @returns {HTMLElement} Элемент строки заголовка
 */
export function addHeaderRow(key = '', value = '') {
    const headersContainer = document.getElementById('headers-container');
    
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'form-control header-key';
    keyInput.placeholder = 'Ключ';
    keyInput.value = key;
    
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'form-control header-value';
    valueInput.placeholder = 'Значение';
    valueInput.value = value;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-small btn-danger remove-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => {
        headerRow.remove();
    });
    
    headerRow.appendChild(keyInput);
    headerRow.appendChild(valueInput);
    headerRow.appendChild(removeBtn);
    
    headersContainer.appendChild(headerRow);
    
    return headerRow;
}

/**
 * Форматирование JSON-тела запроса
 */
export function formatJsonBody() {
    const requestBodyTextarea = document.getElementById('request-body');
    const jsonText = requestBodyTextarea.value.trim();
    
    if (jsonText) {
        try {
            const formattedJson = JSON.stringify(JSON.parse(jsonText), null, 2);
            requestBodyTextarea.value = formattedJson;
        } catch (e) {
            console.error('Ошибка в формате JSON:', e);
            // Здесь должен быть импорт из UI модуля
            // UI.showNotification('Ошибка в формате JSON', 'error');
        }
    }
}

/**
 * Сброс полей ответа
 */
export function resetResponse() {
    document.getElementById('response-meta').textContent = '';
    document.getElementById('response-body').textContent = 'Отправьте запрос, чтобы увидеть ответ';
    document.getElementById('response-headers').textContent = '';
}

/**
 * Создание выпадающего списка источников API
 */
export function createSourceDropdown() {
    // Удаляем существующий выпадающий список, если он есть
    const existingDropdown = document.getElementById('api-source-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    const dropdown = document.createElement('div');
    dropdown.id = 'api-source-dropdown';
    dropdown.className = 'api-source-dropdown';
    
    const sources = getAvailableSources();
    const currentSource = getCurrentSourceInfo();
    
    // Заголовок выпадающего списка
    const dropdownHeader = document.createElement('div');
    dropdownHeader.className = 'dropdown-header';
    dropdownHeader.textContent = 'Выберите источник API';
    dropdown.appendChild(dropdownHeader);
    
    // Список источников
    sources.forEach(source => {
        const sourceItem = document.createElement('div');
        sourceItem.className = 'dropdown-item';
        
        if (source.key === currentSource.key) {
            sourceItem.classList.add('active');
        }
        
        sourceItem.textContent = source.name;
        sourceItem.title = source.description;
        
        sourceItem.addEventListener('click', function() {
            switchApiSource(source.key);
            dropdown.classList.remove('show');
        });
        
        dropdown.appendChild(sourceItem);
    });
    
    // Добавляем выпадающий список на страницу
    document.body.appendChild(dropdown);
    
    // Показываем список
    dropdown.classList.add('show');
    
    // Закрытие списка при клике вне его
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && 
            e.target.id !== 'api-source-selector' && 
            !e.target.closest('.api-source-selector-container')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
    
    // Позиционирование списка относительно селектора источников API
    const selector = document.getElementById('api-source-selector');
    if (selector) {
        const selectorRect = selector.getBoundingClientRect();
        dropdown.style.top = `${selectorRect.bottom + window.scrollY + 5}px`;
        dropdown.style.left = `${selectorRect.left + window.scrollX}px`;
    } else {
        // Запасной вариант - если селектор не найден
        const container = document.querySelector('.api-source-selector-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            dropdown.style.top = `${containerRect.bottom + window.scrollY + 5}px`;
            dropdown.style.left = `${containerRect.left + window.scrollX}px`;
        }
    }
    
    return dropdown;
}