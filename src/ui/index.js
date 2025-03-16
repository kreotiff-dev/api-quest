/**
 * Корневой модуль UI
 * @module ui
 */

import { showNotification } from './notifications.js';
import { toggleLoadingIndicator } from './loading.js';
import { emit } from '../core/events.js';

/**
 * Переключение между экранами
 * @param {string} screen - Экран для активации ('tasks' или 'workspace')
 */
export function switchScreen(screen) {
    const tasksScreen = document.getElementById('tasks-screen');
    const workspaceScreen = document.getElementById('workspace-screen');
    
    if (screen === 'tasks') {
        tasksScreen?.classList.add('active');
        workspaceScreen?.classList.remove('active');
        emit('screenChanged', 'tasks');
    } else if (screen === 'workspace') {
        tasksScreen?.classList.remove('active');
        workspaceScreen?.classList.add('active');
        emit('screenChanged', 'workspace');
    }
}

/**
 * Открытие модального окна
 * @param {string} modalId - ID модального окна
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        emit('modalOpened', modalId);
    }
}

/**
 * Закрытие модального окна
 * @param {string} modalId - ID модального окна
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        emit('modalClosed', modalId);
    }
}

/**
 * Открытие документации API
 */
export function openApiDocs() {
    openModal('api-docs-modal');
}

/**
 * Создание модального окна с динамическим содержимым
 * @param {string} title - Заголовок окна
 * @param {string|HTMLElement} content - Содержимое
 * @param {Function} [onClose] - Функция, вызываемая при закрытии
 * @returns {HTMLElement} Элемент модального окна
 */
export function createDynamicModal(title, content, onClose = null) {
    // Проверяем, существует ли контейнер для динамических модальных окон
    let dynamicModal = document.getElementById('dynamic-modal');
    
    if (!dynamicModal) {
        // Создаем модальное окно, если его нет
        dynamicModal = document.createElement('div');
        dynamicModal.id = 'dynamic-modal';
        dynamicModal.className = 'modal';
        
        // Создаем контент модального окна
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Создаем заголовок
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h2');
        modalTitle.id = 'dynamic-modal-title';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            dynamicModal.style.display = 'none';
            if (onClose && typeof onClose === 'function') {
                onClose();
            }
            emit('modalClosed', 'dynamic-modal');
        };
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        
        // Создаем тело модального окна
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.id = 'dynamic-modal-body';
        
        // Собираем модальное окно
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        dynamicModal.appendChild(modalContent);
        
        // Добавляем в body
        document.body.appendChild(dynamicModal);
        
        // Добавляем обработчик для закрытия при клике вне содержимого
        dynamicModal.onclick = function(event) {
            if (event.target === dynamicModal) {
                dynamicModal.style.display = 'none';
                if (onClose && typeof onClose === 'function') {
                    onClose();
                }
                emit('modalClosed', 'dynamic-modal');
            }
        };
    }
    
    // Обновляем содержимое
    document.getElementById('dynamic-modal-title').textContent = title;
    document.getElementById('dynamic-modal-body').innerHTML = '';
    
    if (typeof content === 'string') {
        document.getElementById('dynamic-modal-body').innerHTML = content;
    } else if (content instanceof HTMLElement) {
        document.getElementById('dynamic-modal-body').appendChild(content);
    }
    
    // Показываем модальное окно
    dynamicModal.style.display = 'block';
    emit('modalOpened', 'dynamic-modal');
    
    // Возвращаем ссылку на модальное окно
    return dynamicModal;
}

/**
 * Изменение состояния кнопки (активная/неактивная)
 * @param {string} buttonId - ID кнопки
 * @param {boolean} enabled - Включить/выключить
 */
export function toggleButtonState(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (enabled) {
            button.removeAttribute('disabled');
            button.classList.remove('disabled');
        } else {
            button.setAttribute('disabled', 'disabled');
            button.classList.add('disabled');
        }
    }
}

/**
 * Обновление индикатора прогресса
 * @param {string} progressBarId - ID элемента прогресса
 * @param {number} percentage - Процент заполнения (0-100)
 */
export function updateProgressBar(progressBarId, percentage) {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

/**
 * Выделение активного элемента в группе
 * @param {string} elementsSelector - CSS-селектор группы элементов
 * @param {number} activeIndex - Индекс активного элемента
 */
export function setActiveElement(elementsSelector, activeIndex) {
    const elements = document.querySelectorAll(elementsSelector);
    elements.forEach((elem, index) => {
        if (index === activeIndex) {
            elem.classList.add('active');
        } else {
            elem.classList.remove('active');
        }
    });
}

/**
 * Инициализация модуля UI
 */
export function init() {
    // Можно добавить дополнительную инициализацию UI
    console.log('UI модуль инициализирован');
}

// Реэкспорт функций из подмодулей для удобства использования
export { showNotification, toggleLoadingIndicator };