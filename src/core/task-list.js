/**
 * Модуль управления списком заданий
 * @module core/task-list
 */

import { getAllTasks, filterTasks, getStatusClass, getStatusText, getDifficultyText, getCategoryText } from '../data/tasks.js';
import { checkTaskCompletion } from '../core/tasks.js';
import { getUserProgress } from '../data/user-progress.js';
import { emit } from './events.js';
import { setCurrentTask, setCurrentScreen } from '../app.js';
import { switchScreen } from '../ui/index.js';
import { setupTaskWorkspace } from '../core/workspace.js';
import { sendApiRequest, resetRequest, formatJsonBody, addHeaderRow } from '../api/client/index.js';

/**
 * Отрисовка списка заданий
 * @param {Object} [filters=null] - Объект с фильтрами
 */
export function renderTaskList(filters = null) {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    // Получаем задания
    const tasks = filters ? filterTasks(filters) : getAllTasks();
    
    // Очистка контейнера
    tasksContainer.innerHTML = '';
    
    // Создание и добавление карточек заданий
    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
    
    // Генерируем событие отрисовки списка
    emit('taskListRendered', { tasks, filters });
}

/**
 * Создание карточки задания
 * @param {Object} task - Объект задания
 * @returns {HTMLElement} Элемент карточки
 */
export function createTaskCard(task) {
    // Получаем прогресс пользователя
    const userProgress = getUserProgress();
    const taskStatus = userProgress.taskStatuses[task.id] || task.status || 'not_started';
    
    // Создаем карточку
    const card = document.createElement('div');
    card.className = `task-card ${task.difficulty} ${taskStatus}`;
    card.dataset.taskId = task.id;
    
    // Метод и категория
    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';
    
    // Создаем метку метода, если он есть
    if (task.solution && task.solution.method) {
        const methodBadge = document.createElement('div');
        methodBadge.className = `method-badge ${task.solution.method.toLowerCase()}`;
        methodBadge.textContent = task.solution.method;
        taskMeta.appendChild(methodBadge);
    }
    
    // Создаем метку категории
    const categoryBadge = document.createElement('div');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = getCategoryText(task.category);
    taskMeta.appendChild(categoryBadge);
    
    // Заголовок задания
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    
    // Подзаголовок задания
    const subtitle = document.createElement('div');
    subtitle.className = 'task-subtitle';
    subtitle.textContent = task.subtitle;
    
    // Метки
    const tags = document.createElement('div');
    tags.className = 'task-tags';
    
    task.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tags.appendChild(tagSpan);
    });
    
    // Информация о прогрессе
    const progress = document.createElement('div');
    progress.className = 'task-completion-status';
    
    const statusIcon = document.createElement('i');
    statusIcon.className = 'fas';
    
    if (taskStatus === 'completed') {
        statusIcon.className += ' fa-check-circle';
        statusIcon.title = 'Выполнено';
    } else if (taskStatus === 'in_progress') {
        statusIcon.className += ' fa-spinner';
        statusIcon.title = 'В процессе';
    } else if (taskStatus === 'locked') {
        statusIcon.className += ' fa-lock';
        statusIcon.title = 'Заблокировано';
    } else {
        statusIcon.className += ' fa-circle';
        statusIcon.title = 'Не начато';
    }
    
    progress.appendChild(statusIcon);
    
    // Сборка карточки
    card.appendChild(taskMeta);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(tags);
    card.appendChild(progress);
    
    // Добавление обработчика клика
    card.addEventListener('click', () => {
        // Проверяем, не заблокировано ли задание
        if (taskStatus === 'locked') {
            // В будущем здесь будет вызов UI.showNotification
            console.warn('Это задание пока заблокировано. Выполните предыдущие задания, чтобы разблокировать его.');
            return;
        }
        
        // Открываем задание
        loadTask(task.id);
    });
    
    return card;
}

/**
 * Загрузка задания
 * @param {number} taskId - ID задания
 */
export function loadTask(taskId) {
    console.log('Вызвана loadTask с ID:', taskId);
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
        console.error('Задание не найдено:', taskId);
        return;
    }
    
    console.log('Задание найдено:', task);
    
    // Устанавливаем текущую задачу в глобальном контексте
    setCurrentTask(task);
    
    // Сначала переключаем экран
    console.log('Прямой вызов switchScreen');
    switchScreen('workspace');
    setCurrentScreen('workspace');
    
    // Заполняем содержимым страницу
    setTimeout(() => {
        fillWorkspaceContent(task);
    }, 50);
}

function fillWorkspaceContent(task) {
    console.log('Заполнение содержимого рабочей области');
    
    // Находим workspaceScreen
    const workspaceScreen = document.getElementById('workspace-screen');
    if (!workspaceScreen) {
        console.error('workspaceScreen не найден');
        return;
    }
    
    // Находим main-content внутри workspaceScreen
    const mainContent = workspaceScreen.querySelector('.main-content');
    if (!mainContent) {
        console.error('main-content не найден внутри workspaceScreen');
        return;
    }
    
    // Очищаем main-content, сохраняя важные элементы
    const existingElements = Array.from(mainContent.children);
    existingElements.forEach(el => {
        if (el.id === 'workspace-container' || 
            el.classList.contains('content-header') || 
            el.classList.contains('response-panel') || 
            el.classList.contains('ai-feedback-panel')) {
            mainContent.removeChild(el);
        }
    });
    
    // Добавляем полную структуру интерфейса
    addContentHeader(mainContent, task);
    addWorkspaceContainer(mainContent, task);
    addResponsePanel(mainContent, task);
    addAIFeedbackPanel(mainContent, task);
    
    // Добавляем обработчики событий
    addEventHandlers();
    
    // Попытка настроить рабочую область
    try {
        setupTaskWorkspace(task);
        console.log('setupTaskWorkspace выполнен успешно');
    } catch (error) {
        console.error('Ошибка при настройке рабочей области:', error);
    }
}

// Функция для добавления заголовка и кнопки "Проверить решение"
function addContentHeader(parentElement, task) {
    const contentHeader = document.createElement('div');
    contentHeader.className = 'content-header';
    contentHeader.innerHTML = `
        <h2 id="task-title">${task.title}</h2>
        <div class="actions">
            <button class="btn btn-success" id="check-solution">
                <i class="fas fa-check"></i> Проверить решение
            </button>
        </div>
    `;
    parentElement.appendChild(contentHeader);
    console.log('content-header добавлен');
}

// Функция для добавления рабочей области с панелями задания и API-клиента
function addWorkspaceContainer(parentElement, task) {
    const workspaceContainer = document.createElement('div');
    workspaceContainer.id = 'workspace-container';
    workspaceContainer.className = 'workspace-container';
    
    // Заполняем workspace-container полным содержимым
    workspaceContainer.innerHTML = `
        <!-- Панель деталей задания (левая колонка) -->
        <div class="task-details-panel">
            <div class="task-subtitle" id="task-subtitle">${task.subtitle}</div>
            
            <div class="task-meta">
                <div id="task-category">Категория: <strong>${getCategoryText(task.category)}</strong></div>
                <div id="task-difficulty">Сложность: <strong>${getDifficultyText(task.difficulty)}</strong></div>
            </div>
            
            <div class="task-description" id="task-description">
                <h3>Описание задания</h3>
                <p>${task.description}</p>
            </div>
            
            <div class="task-requirements">
                <h3>Требования</h3>
                <div class="requirements-list">
                    <ul>
                        ${task.requirements ? task.requirements.map(req => `<li><i class="fas fa-check-circle"></i> ${req}</li>`).join('') : '<li>Нет специальных требований для этого задания.</li>'}
                    </ul>
                </div>
            </div>
            
            <div class="task-expected-result" id="task-expected-result">
                <h3>Ожидаемый результат</h3>
                <p>${task.expectedResult || 'Выполните все требования задания.'}</p>
            </div>
        </div>
        
        <!-- API Клиент (правая колонка) -->
        <div class="api-client-panel">
            <div class="api-client-tabs">
                <div class="api-tab active" data-tab="request">Запрос</div>
                <div class="api-tab" data-tab="collection">Коллекция</div>
                <div class="api-tab" data-tab="tests">Тесты</div>
            </div>
            
            <div class="api-client-tab-content active" id="request-tab">
                <div class="form-group">
                    <label for="request-url">URL</label>
                    <input type="text" id="request-url" class="form-control" placeholder="Введите URL запроса">
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="request-method">Метод</label>
                        <select id="request-method" class="form-control">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>
                    
                    <div class="form-group half">
                        <label for="request-content-type">Content-Type</label>
                        <select id="request-content-type" class="form-control">
                            <option value="application/json">application/json</option>
                            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                            <option value="multipart/form-data">multipart/form-data</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="header-section">
                        <label>Заголовки</label>
                        <button id="add-header" class="btn btn-sm"><i class="fas fa-plus"></i> Добавить</button>
                    </div>
                    <div id="headers-container" class="headers-container">
                        <!-- Заголовки будут добавлены динамически -->
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="request-body">Тело запроса</label>
                    <textarea id="request-body" class="form-control code-editor" rows="8" placeholder="{ }"></textarea>
                </div>
                
                <div class="form-actions">
                    <button id="send-request" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Отправить запрос</button>
                    <button id="reset-request" class="btn"><i class="fas fa-undo"></i> Сбросить</button>
                    <button id="format-json-btn" class="btn"><i class="fas fa-align-left"></i> Форматировать JSON</button>
                </div>
            </div>
            
            <div class="api-client-tab-content" id="collection-tab">
                <div class="collection-placeholder">
                    <div class="placeholder-icon"><i class="fas fa-folder-open"></i></div>
                    <p>Коллекции запросов будут доступны в будущих версиях.</p>
                </div>
            </div>
            
            <div class="api-client-tab-content" id="tests-tab">
                <div class="collection-placeholder">
                    <div class="placeholder-icon"><i class="fas fa-vial"></i></div>
                    <p>Тесты будут доступны в будущих версиях.</p>
                </div>
            </div>
        </div>
    `;
    
    parentElement.appendChild(workspaceContainer);
    console.log('workspace-container добавлен с полным содержимым');
}

// Функция для добавления панели ответа
function addResponsePanel(parentElement, task) {
    const responsePanel = document.createElement('div');
    responsePanel.className = 'response-panel';
    responsePanel.id = 'response-panel';
    responsePanel.innerHTML = `
        <div class="response-header">
            <h3>Ответ</h3>
            <div class="response-meta" id="response-meta">
                <!-- Метаданные ответа будут добавлены динамически -->
            </div>
        </div>
        
        <div class="response-tabs">
            <div class="response-tab active" data-tab="body">Тело</div>
            <div class="response-tab" data-tab="headers">Заголовки</div>
        </div>
        
        <div id="body-response-tab" class="response-tab-content active">
            <pre id="response-body" class="response-body">Отправьте запрос, чтобы увидеть ответ</pre>
        </div>
        
        <div id="headers-response-tab" class="response-tab-content">
            <pre id="response-headers" class="response-headers"></pre>
        </div>
    `;
    parentElement.appendChild(responsePanel);
    console.log('response-panel добавлен');
}

// Функция для добавления панели AI-ассистента
function addAIFeedbackPanel(parentElement, task) {
    const aiFeedbackPanel = document.createElement('div');
    aiFeedbackPanel.className = 'ai-feedback-panel';
    aiFeedbackPanel.id = 'ai-feedback-panel';
    aiFeedbackPanel.innerHTML = `
        <div class="ai-feedback-header">
            <h3><i class="fas fa-robot"></i> AI Ассистент</h3>
            <div class="ai-feedback-actions">
                <button class="btn btn-small"><i class="fas fa-question-circle"></i></button>
                <button class="btn btn-small"><i class="fas fa-search"></i></button>
            </div>
        </div>
        <div class="ai-feedback-content" id="ai-feedback-content">
            <div class="ai-message">
                <p>Здравствуйте! Я ваш AI-ассистент. Готов помочь с выполнением задания. Вы можете попросить помощь или анализ вашего решения в любой момент.</p>
            </div>
        </div>
        <div class="ai-input-container">
            <input type="text" class="form-control" placeholder="Задайте вопрос ассистенту...">
            <button class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
        </div>
    `;
    parentElement.appendChild(aiFeedbackPanel);
    console.log('ai-feedback-panel добавлен');
}

// Функция для добавления обработчиков событий для всех элементов
function addEventHandlers() {
    // Обработчик для кнопки проверки решения
    document.getElementById('check-solution')?.addEventListener('click', function() {
        console.log('Проверка решения');
        checkTaskCompletion();
    });
    
    // Обработчик для кнопки отправки запроса
    document.getElementById('send-request')?.addEventListener('click', function() {
        console.log('Отправка запроса');
        sendApiRequest(); // Вызываем настоящую функцию отправки запроса
    });
    
    // Обработчик для кнопки сброса запроса
    document.getElementById('reset-request')?.addEventListener('click', function() {
        console.log('Сброс запроса');
        resetRequest(); // Вызываем настоящую функцию сброса
    });
    
    // Обработчик для кнопки форматирования JSON
    document.getElementById('format-json-btn')?.addEventListener('click', function() {
        console.log('Форматирование JSON');
        formatJsonBody(); // Вызываем настоящую функцию форматирования
    });
    
    // Обработчик для кнопки добавления заголовка
    document.getElementById('add-header')?.addEventListener('click', function() {
        console.log('Добавление заголовка');
        addHeaderRow(); // Вызываем настоящую функцию добавления заголовка
    });
    
    // Обработчики для табов API клиента
    document.querySelectorAll('.api-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabGroup = this.closest('.api-client-tabs').parentElement;
            tabGroup.querySelectorAll('.api-tab').forEach(t => t.classList.remove('active'));
            tabGroup.querySelectorAll('.api-client-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-tab`;
            tabGroup.querySelector(`#${tabId}`)?.classList.add('active');
        });
    });
    
    // Обработчики для табов ответа
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabGroup = this.closest('.response-tabs').parentElement;
            tabGroup.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            tabGroup.querySelectorAll('.response-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-response-tab`;
            tabGroup.querySelector(`#${tabId}`)?.classList.add('active');
        });
    });
    
    console.log('Обработчики событий добавлены');
}

/**
 * Создание HTML-структуры фильтров
 */
export function createFilters() {
    const filtersPanel = document.getElementById('filters-panel');
    if (!filtersPanel) return;
    
    // Очищаем панель фильтров
    filtersPanel.innerHTML = '';
    
    // Создаем структуру фильтров
    const filtersHTML = `
        <div class="filters-header">
            <h3>Фильтры</h3>
            <button class="btn btn-text" id="reset-filters">Сбросить</button>
        </div>
        <div class="filters-body">
            <div class="filter-group">
                <div class="filter-label">Категория:</div>
                <div class="filter-options" data-filter="category">
                    <div class="filter-option active" data-value="all">Все</div>
                    <div class="filter-option" data-value="basics">Основы API</div>
                    <div class="filter-option" data-value="http">Методы HTTP</div>
                    <div class="filter-option" data-value="auth">Аутентификация</div>
                    <div class="filter-option" data-value="testing">Тестирование</div>
                </div>
            </div>
            <div class="filter-group">
                <div class="filter-label">Сложность:</div>
                <div class="filter-options" data-filter="difficulty">
                    <div class="filter-option active" data-value="all">Все</div>
                    <div class="filter-option" data-value="easy">Начальный</div>
                    <div class="filter-option" data-value="medium">Средний</div>
                    <div class="filter-option" data-value="hard">Продвинутый</div>
                </div>
            </div>
            <div class="filter-group">
                <div class="filter-label">Статус:</div>
                <div class="filter-options" data-filter="status">
                    <div class="filter-option active" data-value="all">Все</div>
                    <div class="filter-option" data-value="not_started">Не начато</div>
                    <div class="filter-option" data-value="in_progress">В процессе</div>
                    <div class="filter-option" data-value="completed">Завершено</div>
                </div>
            </div>
        </div>
    `;
    
    filtersPanel.innerHTML = filtersHTML;
}

/**
 * Инициализация фильтров
 */
export function initFilters() {
    // Создаем HTML-структуру фильтров
    createFilters();
    
    // Фильтр по категории
    const categoryOptions = document.querySelectorAll('[data-filter="category"] .filter-option');
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем активный класс у всех опций данной группы
            categoryOptions.forEach(opt => opt.classList.remove('active'));
            // Добавляем активный класс текущей опции
            this.classList.add('active');
            // Применяем фильтры
            applyFilters();
        });
    });
    
    // Фильтр по сложности
    const difficultyOptions = document.querySelectorAll('[data-filter="difficulty"] .filter-option');
    difficultyOptions.forEach(option => {
        option.addEventListener('click', function() {
            difficultyOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
    
    // Фильтр по статусу
    const statusOptions = document.querySelectorAll('[data-filter="status"] .filter-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            statusOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
    
    // Сброс фильтров
    document.getElementById('reset-filters')?.addEventListener('click', resetFilters);
    
    // Применяем фильтры сразу после инициализации, чтобы показать все задания
    applyFilters();
}

/**
 * Сброс фильтров
 */
export function resetFilters() {
    // Устанавливаем "all" активным для всех групп фильтров
    document.querySelectorAll('.filter-options .filter-option').forEach(option => {
        if (option.dataset.value === 'all') {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Применяем фильтры (в данном случае отобразятся все задания)
    applyFilters();
}

/**
 * Применение фильтров
 */
export function applyFilters() {
    // Получаем значения активных фильтров
    const categoryFilter = document.querySelector('[data-filter="category"] .filter-option.active')?.dataset.value;
    const difficultyFilter = document.querySelector('[data-filter="difficulty"] .filter-option.active')?.dataset.value;
    const statusFilter = document.querySelector('[data-filter="status"] .filter-option.active')?.dataset.value;
    
    // Формируем объект фильтров
    const filters = {
        category: categoryFilter !== 'all' ? categoryFilter : null,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : null,
        status: statusFilter !== 'all' ? statusFilter : null
    };
    
    // Отрисовка отфильтрованных задач
    renderTaskList(filters);
}

export default {
    renderTaskList,
    createTaskCard,
    loadTask,
    initFilters,
    resetFilters,
    applyFilters,
    createFilters
};