/**
 * Модуль управления списком заданий
 * @module core/task-list
 */

import { getAllTasks, filterTasks, getStatusClass, getStatusText, getDifficultyText, getCategoryText } from '../data/tasks.js';
import { getUserProgress } from '../data/user-progress.js';
import { emit } from './events.js';
import { setCurrentTask, setCurrentScreen } from '../app.js';

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
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
        console.error('Задание не найдено:', taskId);
        return;
    }
    
    // Устанавливаем текущую задачу в глобальном контексте
    setCurrentTask(task);
    
    // Генерируем событие загрузки задания
    emit('taskLoaded', task);
    
    // Переключаем экран на рабочую область
    setCurrentScreen('workspace');
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
    
    // После создания фильтров, инициализируем их обработчики
    initFilters();
}

/**
 * Инициализация фильтров
 */
export function initFilters() {
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
    applyFilters
};