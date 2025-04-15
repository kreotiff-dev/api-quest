/**
 * Корневой модуль UI
 * @module ui
 */

import { showNotification } from './notifications.js';
import { toggleLoadingIndicator } from './loading.js';
import { emit } from '../core/events.js';

/**
 * Переключение между экранами
 * @param {string} screen - Экран для активации ('tasks', 'workspace', 'courses')
 */
export function switchScreen(screen) {
    console.log(`switchScreen вызвана с параметром ${screen}`);
    
    const tasksScreen = document.getElementById('tasks-screen');
    const workspaceScreen = document.getElementById('workspace-screen');
    const coursesScreen = document.getElementById('courses-screen');
    
    // Скрываем все экраны
    if (tasksScreen) {
        tasksScreen.classList.remove('active');
        tasksScreen.style.display = 'none';
    }
    
    if (workspaceScreen) {
        workspaceScreen.classList.remove('active');
        workspaceScreen.style.display = 'none';
    }
    
    if (coursesScreen) {
        coursesScreen.classList.remove('active');
        coursesScreen.style.display = 'none';
    }
    
    // Показываем нужный экран
    switch (screen) {
        case 'tasks':
            if (tasksScreen) {
                tasksScreen.classList.add('active');
                tasksScreen.style.display = 'block';
            }
            break;
            
        case 'workspace':
            if (workspaceScreen) {
                workspaceScreen.classList.add('active');
                workspaceScreen.style.display = 'block';
            }
            break;
            
        case 'courses':
            if (coursesScreen) {
                coursesScreen.classList.add('active');
                coursesScreen.style.display = 'block';
            }
            break;
    }
    
    // Генерируем событие о смене экрана
    emit('screenChanged', screen);
}

/**
 * Переключение между разделами приложения
 * @param {string} section - Раздел для активации ('tasks', 'courses', 'progress', etc)
 */
export function switchSection(section) {
    console.log(`Переключение на раздел: ${section}`);
    
    // Получаем все элементы меню
    const menuItems = document.querySelectorAll('.main-nav li');
    
    // Сначала снимаем активный класс со всех элементов
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Затем находим соответствующий пункт меню и делаем его активным
    const activeMenuItem = document.querySelector(`.main-nav li a[data-section="${section}"]`);
    if (activeMenuItem) {
        // Находим родительский элемент 'li' и делаем его активным
        const parentLi = activeMenuItem.closest('li');
        if (parentLi) {
            parentLi.classList.add('active');
        }
    }
    
    // Обрабатываем переключение контента в зависимости от раздела
    switch (section) {
        case 'dashboard':
            // Показываем экран заданий (дашборд на этом экране)
            switchScreen('tasks');
            // Обновляем заголовок
            document.querySelector('.content-header h2').textContent = 'Мой дашборд';
            
            // Показываем дашборд, скрываем старые задания
            const dashboardContainer = document.getElementById('dashboard-container');
            const tasksLegacyUi = document.getElementById('tasks-legacy-ui');
            
            if (dashboardContainer) dashboardContainer.style.display = 'flex';
            if (tasksLegacyUi) tasksLegacyUi.style.display = 'none';
            
            // Скрываем другие контейнеры
            hideContainer('courses-container');
            hideContainer('course-details-container');
            hideContainer('module-details-container');
            
            // Инициализируем дашборд, если он еще не инициализирован
            import('../dashboard/index.js').then(module => {
                module.default.initDashboard();
            });
            
            // Генерируем событие о смене раздела
            emit('sectionChanged', 'dashboard');
            break;
            
        case 'tasks-legacy':
            // Показываем экран заданий со старым интерфейсом
            switchScreen('tasks');
            // Обновляем заголовок
            document.querySelector('.content-header h2').textContent = 'Задания по API (устаревшее)';
            
            // Скрываем дашборд, показываем старые задания
            const dashboardContainerLegacy = document.getElementById('dashboard-container');
            const tasksLegacyUiLegacy = document.getElementById('tasks-legacy-ui');
            
            if (dashboardContainerLegacy) dashboardContainerLegacy.style.display = 'none';
            if (tasksLegacyUiLegacy) tasksLegacyUiLegacy.style.display = 'block';
            
            // Скрываем другие контейнеры
            hideContainer('courses-container');
            hideContainer('course-details-container');
            hideContainer('module-details-container');
            
            // Генерируем событие о смене раздела
            emit('sectionChanged', 'tasks-legacy');
            break;
            
        case 'tasks':
            // Для обратной совместимости - теперь это дашборд
            switchSection('dashboard');
            return; // Важно вернуться, чтобы избежать бесконечного цикла
            
        case 'courses':
            // Показываем экран заданий (так как курсы будут на том же экране)
            switchScreen('tasks');
            // Обновляем заголовок
            document.querySelector('.content-header h2').textContent = 'Курсы';
            
            // Скрываем другие контейнеры
            hideContainer('dashboard-container');
            hideContainer('tasks-legacy-ui');
            hideContainer('course-details-container');
            hideContainer('module-details-container');
            
            // Показываем контейнер курсов, создаем его если не существует
            let coursesContainer = document.getElementById('courses-container');
            if (!coursesContainer) {
                coursesContainer = document.createElement('div');
                coursesContainer.id = 'courses-container';
                coursesContainer.className = 'courses-grid';
                
                // Добавляем контейнер в main-content
                document.querySelector('.main-content').appendChild(coursesContainer);
            }
            
            coursesContainer.style.display = 'grid';
            
            // Генерируем событие о смене раздела
            emit('sectionChanged', 'courses');
            
            // Генерируем событие для загрузки курсов
            emit('coursesTabActivated');
            break;
            
        case 'course-details':
            // Показываем экран заданий (так как детали курса будут на том же экране)
            switchScreen('tasks');
            // Обновляем заголовок (будет меняться в зависимости от курса)
            document.querySelector('.content-header h2').textContent = 'Детали курса';
            
            // Скрываем другие контейнеры
            hideContainer('tasks-container');
            hideContainer('courses-container');
            hideContainer('module-details-container');
            
            // Показываем контейнер деталей курса
            let detailsContainer = document.getElementById('course-details-container');
            if (detailsContainer) {
                detailsContainer.style.display = 'block';
            }
            
            // Генерируем событие о смене раздела
            emit('sectionChanged', 'course-details');
            break;
            
        case 'module-details':
            // Показываем экран заданий (так как детали модуля будут на том же экране)
            switchScreen('tasks');
            // Обновляем заголовок
            document.querySelector('.content-header h2').textContent = 'Детали модуля';
            
            // Скрываем другие контейнеры
            hideContainer('tasks-container');
            hideContainer('courses-container');
            hideContainer('course-details-container');
            
            // Показываем контейнер деталей модуля
            let moduleDetailsContainer = document.getElementById('module-details-container');
            if (moduleDetailsContainer) {
                moduleDetailsContainer.style.display = 'block';
            }
            
            // Генерируем событие о смене раздела
            emit('sectionChanged', 'module-details');
            break;
            
        case 'progress':
            // Логика для раздела "Мой прогресс" будет добавлена позже
            break;
            
        case 'theory':
            // Логика для раздела "Теория" будет добавлена позже
            break;
            
        case 'help':
            // Логика для раздела "Помощь" будет добавлена позже
            break;
    }
}

/**
 * Скрывает контейнер по его ID, если он существует
 * @param {string} containerId - ID контейнера
 */
function hideContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = 'none';
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
    // Добавляем дополнительные пункты меню
    setupUI();
    
    // Добавляем обработчики для элементов меню
    setupEventListeners();
    
    console.log('UI модуль инициализирован');
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Находим все ссылки в боковой панели
    const navLinks = document.querySelectorAll('.main-nav li a[data-section]');
    
    // Добавляем обработчики для каждой ссылки
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const section = this.getAttribute('data-section');
            if (section) {
                console.log(`Клик по секции: ${section}`);
                switchSection(section);
            }
        });
    });
    
    // Добавляем специальный обработчик для вкладки курсов
    const coursesLink = document.querySelector('.main-nav li a[data-section="courses"]');
    if (coursesLink) {
        coursesLink.addEventListener('click', function(e) {
            console.log('Клик по вкладке Курсы');
            // Дополнительно вызываем событие для загрузки курсов, если это необходимо
            emit('coursesTabActivated');
        });
    }
}

/**
 * Настройка UI элементов
 */
function setupUI() {
    // Не добавляем дополнительные пункты меню, так как они уже есть в HTML
    
    // Добавляем обработчики для приветственного экрана для неавторизованных пользователей
    setupWelcomeScreen();
}

/**
 * Настройка приветственного экрана для неавторизованных пользователей
 */
function setupWelcomeScreen() {
    // Создаем контент для неавторизованных пользователей
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        // Мы отобразим приветственный экран, если пользователь не авторизован
        if (!localStorage.getItem('token')) {
            dashboardContainer.innerHTML = `
                <div class="welcome-screen">
                    <h1>Добро пожаловать в API Практикум!</h1>
                    <div class="welcome-content">
                        <div class="welcome-image">
                            <i class="fas fa-code fa-5x"></i>
                        </div>
                        <div class="welcome-text">
                            <p>Изучайте и практикуйтесь в работе с различными API.</p>
                            <p>Благодаря нашей платформе вы сможете:</p>
                            <ul>
                                <li>Изучить основы работы с REST API</li>
                                <li>Выполнять практические задания</li>
                                <li>Получить мгновенную обратную связь</li>
                                <li>Отслеживать свой прогресс</li>
                            </ul>
                            <p>Авторизуйтесь, чтобы начать обучение!</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Добавляем стили для welcome-screen
            const style = document.createElement('style');
            style.textContent = `
                .welcome-screen {
                    background-color: var(--color-card-bg);
                    border-radius: var(--border-radius);
                    padding: 2rem;
                    box-shadow: var(--box-shadow-light);
                    text-align: center;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .welcome-screen h1 {
                    margin-bottom: 2rem;
                    color: var(--color-primary);
                }
                
                .welcome-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }
                
                @media (min-width: 768px) {
                    .welcome-content {
                        flex-direction: row;
                        text-align: left;
                    }
                }
                
                .welcome-image {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                    background-color: var(--color-bg-light);
                    border-radius: 50%;
                    color: var(--color-primary);
                }
                
                .welcome-text {
                    flex: 1;
                }
                
                .welcome-text ul {
                    list-style: none;
                    padding-left: 0;
                    margin: 1rem 0;
                }
                
                .welcome-text ul li {
                    position: relative;
                    padding-left: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .welcome-text ul li:before {
                    content: "✓";
                    color: var(--color-success);
                    position: absolute;
                    left: 0;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Реэкспорт функций из подмодулей для удобства использования
export { showNotification, toggleLoadingIndicator, hideContainer };