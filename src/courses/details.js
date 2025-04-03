/**
 * Модуль для отображения деталей курса
 * @module courses/details
 */

import { emit } from '../core/events.js';
import courseList from './index.js';
import { showNotification } from '../ui/notifications.js';

// URL API для курсов
const API_URL = 'http://localhost:3000/api/courses';

/**
 * Класс для отображения деталей курса
 */
class CourseDetails {
  /**
   * Создает экземпляр отображения деталей курса
   * @param {string} containerId - ID контейнера для деталей курса
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentCourse = null;
    this.courseProgress = null;
  }

  /**
   * Инициализирует контейнер, если он не существует
   * @private
   */
  initContainer() {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
      
      if (!this.container) {
        console.log('Создание контейнера для деталей курса');
        
        const mainContent = document.querySelector('#tasks-screen .main-content');
        if (!mainContent) {
          console.error('Не найден элемент main-content для добавления контейнера деталей курса');
          return false;
        }
        
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'course-details';
        this.container.style.display = 'none';
        
        mainContent.appendChild(this.container);
      }
    }
    return true;
  }

  /**
   * Загружает и отображает курс
   * @param {string} courseId - ID курса
   */
  async loadCourse(courseId) {
    if (!this.initContainer()) return;
    
    try {
      // Загружаем курс
      const course = await this.fetchCourse(courseId);
      if (!course) return;
      
      this.currentCourse = course;
      
      // Загружаем прогресс пользователя по курсу
      this.courseProgress = await courseList.getCourseProgress(courseId);
      
      // Загружаем модули курса
      const modules = await this.fetchCourseModules(courseId);
      
      // Отображаем детали курса
      this.renderCourseDetails(course, modules, this.courseProgress);
      
      // Отображаем контейнер
      this.container.style.display = 'block';
      
      // Генерируем событие
      emit('courseDetailsLoaded', { course, modules, progress: this.courseProgress });
      
    } catch (error) {
      console.error('Ошибка при загрузке деталей курса:', error);
      showNotification('Не удалось загрузить детали курса', 'error');
    }
  }

  /**
   * Получает данные курса с сервера
   * @param {string} courseId - ID курса
   * @returns {Promise<Object>} - Объект курса
   * @private
   */
  async fetchCourse(courseId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      showNotification('Необходима авторизация', 'error');
      return null;
    }
    
    const response = await fetch(`${API_URL}/${courseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ошибка при получении курса: ${response.status} ${error}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Получает модули курса с сервера
   * @param {string} courseId - ID курса
   * @returns {Promise<Array>} - Массив модулей
   * @private
   */
  async fetchCourseModules(courseId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      showNotification('Необходима авторизация', 'error');
      return [];
    }
    
    const response = await fetch(`${API_URL}/${courseId}/modules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Ошибка при получении модулей: ${response.status} ${error}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Отображает детали курса
   * @param {Object} course - Объект курса
   * @param {Array} modules - Массив модулей курса
   * @param {Object} progress - Объект прогресса
   * @private
   */
  renderCourseDetails(course, modules, progress) {
    if (!this.container) return;
    
    const isEnrolled = progress && progress.enrolled;
    const completionPercentage = progress ? progress.completionPercentage || 0 : 0;
    
    // Очищаем контейнер
    this.container.innerHTML = '';
    
    // Верхняя секция с информацией о курсе
    const courseInfoHTML = this.createCourseInfoHTML(course, isEnrolled, completionPercentage);
    
    // Секция модулей
    const modulesHTML = this.createModulesHTML(modules, progress);
    
    // Собираем весь HTML
    this.container.innerHTML = `
      ${courseInfoHTML}
      ${modulesHTML}
    `;
    
    // Добавляем обработчики событий
    this.addEventListeners();
  }

  /**
   * Создает HTML с информацией о курсе
   * @param {Object} course - Объект курса
   * @param {boolean} isEnrolled - Записан ли пользователь на курс
   * @param {number} completionPercentage - Процент выполнения курса
   * @returns {string} - HTML разметка
   * @private
   */
  createCourseInfoHTML(course, isEnrolled, completionPercentage) {
    return `
      <div class="course-header-info">
        <div class="course-title-row">
          <h1 class="course-main-title">${course.name}</h1>
          <span class="course-level-indicator ${course.level}">${this.getLevelText(course.level)}</span>
        </div>
        
        <p class="course-description">${course.description}</p>
        
        <div class="course-meta">
          <div class="meta-item">
            <i class="fas fa-clock"></i>
            <span>${course.duration || 0} часов</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-layer-group"></i>
            <span>${course.modules ? course.modules.length : 0} модулей</span>
          </div>
          ${course.tags && course.tags.length > 0 ? `
          <div class="meta-item">
            <i class="fas fa-tags"></i>
            <span>${course.tags.join(', ')}</span>
          </div>
          ` : ''}
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>Автор: ${course.createdBy?.name || 'Неизвестно'}</span>
          </div>
        </div>
        
        <div class="course-actions">
          ${isEnrolled ? `
            <button class="course-btn primary" id="continue-course-btn">
              ${completionPercentage > 0 ? 'Продолжить курс' : 'Начать курс'}
            </button>
          ` : `
            <button class="course-btn primary" id="enroll-course-btn">Записаться на курс</button>
          `}
          <button class="course-btn secondary" id="back-to-courses-btn">Назад к списку курсов</button>
        </div>
        
        ${isEnrolled ? `
        <div class="course-progress-block">
          <div class="progress-header">
            <span class="progress-title">Прогресс</span>
            <span class="progress-percentage">${completionPercentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPercentage}%"></div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Создает HTML с модулями курса
   * @param {Array} modules - Массив модулей
   * @param {Object} progress - Объект прогресса
   * @returns {string} - HTML разметка
   * @private
   */
  createModulesHTML(modules, progress) {
    if (!modules || modules.length === 0) {
      return '<div class="modules-section"><h2 class="section-title">Модули</h2><p>В этом курсе пока нет модулей</p></div>';
    }
    
    // Сортируем модули по порядку
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const modulesHTML = sortedModules.map(module => {
      // Определяем статус модуля
      let statusClass = 'locked';
      let statusText = 'Заблокирован';
      let statusIcon = '<i class="fas fa-lock"></i>';
      
      if (progress && progress.modules) {
        const moduleProgress = progress.modules.find(mp => mp.id === module._id);
        
        if (moduleProgress) {
          if (moduleProgress.completed) {
            statusClass = 'completed';
            statusText = 'Завершен';
            statusIcon = '<i class="fas fa-check"></i>';
          } else if (moduleProgress.started) {
            statusClass = 'in-progress';
            statusText = 'В процессе';
            statusIcon = '<i class="fas fa-spinner"></i>';
          }
        }
      }
      
      // Доступность модуля
      const isAvailable = !module.isLocked || statusClass !== 'locked';
      
      return `
        <div class="module-card ${statusClass}" data-module-id="${module._id}" data-available="${isAvailable}">
          <div class="module-header">
            <h3 class="module-title">${module.title || module.name}</h3>
            <div class="module-status ${statusClass}">
              ${statusIcon}
              <span>${statusText}</span>
            </div>
          </div>
          <p class="module-description">${module.shortDescription || module.description}</p>
          <div class="module-meta">
            <div class="module-tasks">
              <i class="fas fa-tasks"></i>
              <span>${module.tasksCount || 0} заданий</span>
            </div>
            <div class="module-duration">
              <i class="far fa-clock"></i>
              <span>${module.duration || 0} час.</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="modules-section">
        <h2 class="section-title">Модули</h2>
        <div class="modules-list">
          ${modulesHTML}
        </div>
      </div>
    `;
  }

  /**
   * Добавляет обработчики событий
   * @private
   */
  addEventListeners() {
    // Кнопка "Назад к списку курсов"
    const backBtn = this.container.querySelector('#back-to-courses-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hide();
        emit('backToCoursesList');
      });
    }
    
    // Кнопка "Записаться на курс"
    const enrollBtn = this.container.querySelector('#enroll-course-btn');
    if (enrollBtn) {
      enrollBtn.addEventListener('click', () => {
        this.enrollInCourse();
      });
    }
    
    // Кнопка "Продолжить/Начать курс"
    const continueBtn = this.container.querySelector('#continue-course-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.startCourse();
      });
    }
    
    // Клик по модулю
    const moduleCards = this.container.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
      card.addEventListener('click', () => {
        const moduleId = card.dataset.moduleId;
        const isAvailable = card.dataset.available === 'true';
        
        if (isAvailable) {
          this.openModule(moduleId);
        } else {
          showNotification('Этот модуль пока заблокирован', 'warning');
        }
      });
    });
  }

  /**
   * Записывает пользователя на курс
   * @private
   */
  async enrollInCourse() {
    if (!this.currentCourse) return;
    
    try {
      const result = await courseList.enrollInCourse(this.currentCourse._id);
      showNotification('Вы успешно записались на курс', 'success');
      
      // Обновляем детали курса
      this.loadCourse(this.currentCourse._id);
      
    } catch (error) {
      console.error('Ошибка при записи на курс:', error);
      showNotification('Ошибка при записи на курс', 'error');
    }
  }

  /**
   * Начинает прохождение курса
   * @private
   */
  startCourse() {
    if (!this.currentCourse) return;
    
    // Находим первый доступный модуль
    const firstModule = this.container.querySelector('.module-card[data-available="true"]');
    if (firstModule) {
      const moduleId = firstModule.dataset.moduleId;
      this.openModule(moduleId);
    } else {
      showNotification('Не найдено доступных модулей для прохождения', 'warning');
    }
  }

  /**
   * Открывает модуль курса
   * @param {string} moduleId - ID модуля
   * @private
   */
  openModule(moduleId) {
    console.log(`Открытие модуля ${moduleId}`);
    emit('openCourseModule', { courseId: this.currentCourse._id, moduleId });
  }

  /**
   * Скрывает контейнер с деталями курса
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Показывает контейнер с деталями курса
   */
  show() {
    if (!this.initContainer()) return;
    this.container.style.display = 'block';
  }

  /**
   * Получает текст для уровня сложности
   * @param {string} level - Уровень сложности
   * @returns {string} - Текст на русском
   * @private
   */
  getLevelText(level) {
    const levels = {
      'beginner': 'Начальный',
      'intermediate': 'Средний',
      'advanced': 'Продвинутый'
    };
    
    return levels[level] || 'Начальный';
  }
}

/**
 * Экспортируем экземпляр класса для отображения деталей курса
 */
const courseDetails = new CourseDetails('course-details-container');
export default courseDetails;