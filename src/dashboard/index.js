/**
 * Модуль для работы с дашбордом пользователя
 * @module dashboard
 */

import { showNotification } from '../ui/notifications.js';
import { emit, on } from '../core/events.js';
import { getDifficultyText } from '../data/tasks.js';

// URL API для дашборда
const API_URL = 'http://localhost:3000/api/dashboard';

/**
 * Загружает данные для дашборда
 * @returns {Promise<Object>} Данные дашборда
 */
async function loadDashboardData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Ошибка при загрузке данных дашборда:', error);
    showNotification('Не удалось загрузить данные дашборда', 'error');
    throw error;
  }
}

/**
 * Рендерит дашборд с данными пользователя
 * @param {Object} dashboardData - Данные для дашборда
 */
function renderDashboard(dashboardData) {
  const dashboardContainer = document.getElementById('dashboard-container');
  if (!dashboardContainer) {
    console.error('Контейнер дашборда не найден');
    return;
  }

  const { stats, activeTasks, activeCourses } = dashboardData;

  // Форматируем HTML для дашборда
  const dashboardHTML = `
    <!-- Заголовок и общий прогресс -->
    <div class="dashboard-header">
      <h1>Привет, <span id="dashboard-username">${document.getElementById('user-name')?.textContent || 'Пользователь'}</span>!</h1>
      <div class="overall-progress">
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-value">${stats.completedTasks}</span>
            <span class="stat-label">заданий выполнено</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.completedModules}</span>
            <span class="stat-label">модулей завершено</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.completedCourses}</span>
            <span class="stat-label">курсов завершено</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.overallProgress}%</span>
            <span class="stat-label">общий прогресс</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${stats.overallProgress}%"></div>
        </div>
      </div>
    </div>
    
    <!-- Активные задания -->
    <div class="dashboard-section">
      <h2 class="section-title"><i class="fas fa-tasks"></i> Продолжить обучение</h2>
      <div class="active-tasks-list" id="active-tasks-container">
        ${renderTasksList(activeTasks)}
      </div>
    </div>
    
    <!-- Активные курсы -->
    <div class="dashboard-section">
      <h2 class="section-title"><i class="fas fa-book"></i> Ваши курсы</h2>
      <div class="courses-grid" id="active-courses-container">
        ${renderCoursesList(activeCourses)}
      </div>
    </div>
    
    <!-- API Песочница -->
    <div class="dashboard-section">
      <h2 class="section-title"><i class="fas fa-code"></i> API Песочница</h2>
      <div class="api-sandbox">
        <div class="sandbox-description">
          <p>Экспериментируйте с различными API запросами в безопасном окружении</p>
          <button class="btn primary" id="open-sandbox-btn">Открыть песочницу</button>
        </div>
      </div>
    </div>
  `;

  // Обновляем содержимое контейнера
  dashboardContainer.innerHTML = dashboardHTML;

  // Добавляем обработчики событий
  addEventListeners();
}

/**
 * Рендерит список заданий
 * @param {Array} tasks - Массив заданий
 * @returns {string} HTML разметка списка заданий
 */
function renderTasksList(tasks) {
  if (!tasks || tasks.length === 0) {
    return '<p class="empty-state">У вас пока нет активных заданий</p>';
  }

  return tasks.map(task => {
    const isRecommended = task.isRecommended;
    const cardClass = isRecommended ? 'dashboard-task-card recommended' : 'dashboard-task-card';
    const moduleTitle = task.module && task.module.title ? task.module.title : 'Неизвестный модуль';

    return `
      <div class="${cardClass}" data-task-id="${task._id}" data-module-id="${task.module._id}">
        <div class="task-card-header">
          <div class="task-card-title">${task.title}</div>
          <span class="task-difficulty ${task.difficulty}">${getDifficultyText(task.difficulty)}</span>
        </div>
        <div class="task-card-meta">
          <div class="task-meta-item">
            <i class="fas fa-layer-group"></i>
            <span>${moduleTitle}</span>
          </div>
          <div class="task-meta-item">
            <i class="fas fa-code-branch"></i>
            <span>${task.type}</span>
          </div>
        </div>
        <div class="task-card-description">${task.description}</div>
        <div class="task-card-footer">
          <button class="task-continue-btn continue-task-btn" data-task-id="${task._id}" data-module-id="${task.module._id}">
            ${isRecommended ? 'Начать' : 'Продолжить'} <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Рендерит список курсов
 * @param {Array} courses - Массив курсов
 * @returns {string} HTML разметка списка курсов
 */
function renderCoursesList(courses) {
  if (!courses || courses.length === 0) {
    return '<p class="empty-state">Вы пока не начали ни одного курса</p>';
  }

  return courses.map(course => {
    const courseImage = course.image 
      ? `<div class="course-card-image" style="background-image: url('${course.image}');"></div>`
      : `<div class="course-card-image"><i class="fas fa-graduation-cap"></i></div>`;

    return `
      <div class="dashboard-course-card" data-course-id="${course._id}">
        ${courseImage}
        <div class="course-card-content">
          <div class="course-card-title">${course.title}</div>
          <div class="course-card-description">${course.description || 'Нет описания'}</div>
          <div class="course-card-footer">
            <div class="course-progress">
              <div class="course-progress-label">
                <span>Прогресс</span>
                <span>0%</span>
              </div>
              <div class="course-progress-bar">
                <div class="course-progress-fill" style="width: 0%"></div>
              </div>
            </div>
            <button class="course-continue-btn" data-course-id="${course._id}">
              Открыть
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Добавляет обработчики событий для элементов дашборда
 */
function addEventListeners() {
  // Обработчики для карточек заданий
  document.querySelectorAll('.dashboard-task-card').forEach(card => {
    card.addEventListener('click', function() {
      const taskId = this.dataset.taskId;
      const moduleId = this.dataset.moduleId;
      openTask(taskId, moduleId);
    });
  });

  // Специальные обработчики для кнопок продолжения заданий
  document.querySelectorAll('.continue-task-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // Останавливаем всплытие события
      const taskId = this.dataset.taskId;
      const moduleId = this.dataset.moduleId;
      openTask(taskId, moduleId);
    });
  });

  // Обработчики для карточек курсов
  document.querySelectorAll('.dashboard-course-card').forEach(card => {
    card.addEventListener('click', function() {
      const courseId = this.dataset.courseId;
      openCourse(courseId);
    });
  });

  // Специальные обработчики для кнопок открытия курсов
  document.querySelectorAll('.course-continue-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // Останавливаем всплытие события
      const courseId = this.dataset.courseId;
      openCourse(courseId);
    });
  });

  // Обработчик для кнопки песочницы API
  document.getElementById('open-sandbox-btn')?.addEventListener('click', function() {
    openSandbox();
  });
}

/**
 * Открывает задание
 * @param {string} taskId - ID задания
 * @param {string} moduleId - ID модуля
 */
function openTask(taskId, moduleId) {
  emit('openModuleTask', { moduleId, taskId });
}

/**
 * Открывает курс
 * @param {string} courseId - ID курса
 */
function openCourse(courseId) {
  emit('viewCourseDetails', courseId);
}

/**
 * Открывает API песочницу
 */
function openSandbox() {
  // Пока просто переключаем на рабочую область
  emit('screenChanged', 'workspace');
}

/**
 * Инициализирует модуль дашборда
 */
async function initDashboard() {
  try {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Пользователь не авторизован, показываем приветственный экран');
      return;
    }
    
    // Получаем данные для дашборда
    const dashboardData = await loadDashboardData();
    
    // Рендерим дашборд с полученными данными
    renderDashboard(dashboardData);
    
    // Генерируем событие инициализации
    emit('dashboardInitialized', { stats: dashboardData.stats });
    
    console.log('Дашборд успешно инициализирован');
  } catch (error) {
    console.error('Ошибка при инициализации дашборда:', error);
    // Если данные не удалось загрузить, рендерим пустой дашборд
    renderEmptyDashboard();
  }
}

/**
 * Рендерит пустой дашборд в случае ошибки
 */
function renderEmptyDashboard() {
  const dashboardContainer = document.getElementById('dashboard-container');
  if (!dashboardContainer) return;
  
  dashboardContainer.innerHTML = `
    <div class="dashboard-header">
      <h1>Привет, <span id="dashboard-username">${document.getElementById('user-name')?.textContent || 'Пользователь'}</span>!</h1>
      <div class="overall-progress">
        <p>Не удалось загрузить данные прогресса. Попробуйте обновить страницу.</p>
      </div>
    </div>
    
    <div class="dashboard-section">
      <h2 class="section-title"><i class="fas fa-book"></i> Курсы</h2>
      <button class="btn primary" id="view-courses-btn">Перейти к курсам</button>
    </div>
  `;
  
  // Добавляем обработчик для кнопки перехода к курсам
  document.getElementById('view-courses-btn')?.addEventListener('click', function() {
    emit('switchSection', 'courses');
  });
}

// Экспортируем публичные методы
export default {
  initDashboard,
  loadDashboardData,
  renderDashboard
};