/**
 * Модуль для отображения карточек курсов
 * @module courses/renderer
 */

import { emit } from '../core/events.js';

/**
 * Получает отформатированный текст для уровня сложности
 * @param {string} level - Уровень сложности курса
 * @returns {string} - Отформатированный текст уровня
 */
function getLevelText(level) {
  const levels = {
    'beginner': 'Начальный',
    'intermediate': 'Средний',
    'advanced': 'Продвинутый'
  };
  
  return levels[level] || 'Начальный';
}

/**
 * Получает иконку статуса для курса
 * @param {string} status - Статус курса
 * @returns {string} - HTML-код иконки
 */
function getStatusIcon(status) {
  switch (status) {
    case 'completed':
      return '<i class="fas fa-check"></i>';
    case 'in_progress':
      return '<i class="fas fa-spinner"></i>';
    case 'locked':
      return '<i class="fas fa-lock"></i>';
    default:
      return '<i class="fas fa-circle"></i>';
  }
}

/**
 * Класс для рендеринга карточек курсов
 */
class CourseRenderer {
  /**
   * Создает экземпляр рендерера курсов
   * @param {string} containerId - ID контейнера для карточек
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    // Если контейнер не найден, мы создадим его при первом рендеринге
  }

  /**
   * Получает класс статуса курса
   * @param {Object} course - Объект курса
   * @param {Object} progress - Объект прогресса курса
   * @returns {string} - Класс статуса
   */
  getCourseStatusClass(course, progress) {
    if (!progress || !progress.enrolled) {
      return 'not_started';
    }
    
    if (progress.completedAt) {
      return 'completed';
    }
    
    if (progress.startedAt) {
      return 'in_progress';
    }
    
    return 'not_started';
  }
  
  /**
   * Создает HTML для обложки курса
   * @param {Object} course - Объект курса
   * @param {string} statusClass - Класс статуса
   * @returns {string} - HTML обложки
   */
  createCoverHTML(course, statusClass) {
    const levelText = getLevelText(course.level);
    const statusIcon = getStatusIcon(statusClass);
    
    return `
      <div class="course-cover" style="background-image: url('${course.imageUrl || ''}')">
        <div class="course-status ${statusClass}">${statusIcon}</div>
        <div class="course-level">${levelText}</div>
      </div>
    `;
  }
  
  /**
   * Создает HTML для заголовка курса
   * @param {Object} course - Объект курса
   * @returns {string} - HTML заголовка
   */
  createHeaderHTML(course) {
    return `
      <div class="course-header">
        <span class="course-level-badge ${course.level}">${getLevelText(course.level)}</span>
        <h3 class="course-title">${course.name}</h3>
        <h4 class="course-subtitle">${course.shortDescription || ''}</h4>
      </div>
    `;
  }
  
  /**
   * Создает HTML для информации о курсе
   * @param {Object} course - Объект курса
   * @returns {string} - HTML информации
   */
  createInfoHTML(course) {
    return `
      <div class="course-info">
        <div class="course-stats">
          <div class="course-stat">
            <i class="far fa-clock"></i>
            <span>${course.duration || 0} ч</span>
          </div>
          <div class="course-stat">
            <i class="fas fa-layer-group"></i>
            <span>${course.modules ? course.modules.length : 0} модулей</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Создает HTML для прогресса курса
   * @param {Object} progress - Объект прогресса
   * @returns {string} - HTML прогресса
   */
  createProgressHTML(progress) {
    const percentage = progress?.completionPercentage || 0;
    
    return `
      <div class="course-progress-container">
        <div class="course-progress-info">
          <span>Прогресс:</span>
          <span>${percentage}%</span>
        </div>
        <div class="course-progress-bar">
          <div class="course-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }
  
  /**
   * Создает HTML для тегов курса
   * @param {Object} course - Объект курса
   * @returns {string} - HTML тегов
   */
  createTagsHTML(course) {
    if (!course.tags || course.tags.length === 0) {
      return '';
    }
    
    const tagsHTML = course.tags.map(tag => 
      `<span class="course-tag">${tag}</span>`
    ).join('');
    
    return `
      <div class="course-tags">
        ${tagsHTML}
      </div>
    `;
  }
  
  /**
   * Создает HTML для действий с курсом
   * @param {Object} course - Объект курса
   * @param {Object} progress - Объект прогресса
   * @returns {string} - HTML действий
   */
  createActionsHTML(course, progress) {
    let buttonText = 'Начать';
    let buttonClass = 'primary';
    
    if (progress) {
      if (progress.completedAt) {
        buttonText = 'Повторить';
      } else if (progress.startedAt) {
        buttonText = 'Продолжить';
        buttonClass = 'primary';
      }
    }
    
    return `
      <div class="course-actions">
        <button class="course-btn ${buttonClass}">${buttonText}</button>
      </div>
    `;
  }

  /**
   * Рендерит список курсов в контейнер
   * @param {Array} courses - Массив курсов для отображения
   * @param {Object} progressData - Объект с прогрессом по курсам
   */
  async renderCourses(courses, progressData = {}) {
    // Проверяем или создаем контейнер
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
      
      // Если контейнер все еще не найден, создаем его
      if (!this.container) {
        console.log('Создание контейнера для курсов, так как он не найден');
        
        // Находим main-content внутри tasks-screen
        const mainContent = document.querySelector('#tasks-screen .main-content');
        if (!mainContent) {
          console.error('Не найден элемент main-content для добавления контейнера курсов');
          return;
        }
        
        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'courses-grid';
        this.container.style.display = 'grid'; // Видим по умолчанию
        
        // Добавляем в main-content
        mainContent.appendChild(this.container);
      }
    }
    
    // Очищаем контейнер перед рендерингом
    this.container.innerHTML = '';
    
    // Если курсы не переданы - выходим
    if (!courses || courses.length === 0) {
      this.container.innerHTML = '<div class="no-courses">Курсы не найдены</div>';
      return;
    }

    // Рендерим каждый курс
    courses.forEach(course => {
      const progress = progressData[course._id] || null;
      const statusClass = this.getCourseStatusClass(course, progress);
      
      const courseCard = document.createElement('div');
      courseCard.className = 'course-card';
      courseCard.dataset.courseId = course._id;
      
      // Создаем HTML для разных секций карточки
      const coverHTML = this.createCoverHTML(course, statusClass);
      const headerHTML = this.createHeaderHTML(course);
      const infoHTML = this.createInfoHTML(course);
      const progressHTML = this.createProgressHTML(progress);
      const tagsHTML = this.createTagsHTML(course);
      const actionsHTML = this.createActionsHTML(course, progress);
      
      // Собираем HTML карточки
      courseCard.innerHTML = `
        ${coverHTML}
        ${headerHTML}
        <div class="course-content">
          ${infoHTML}
          ${progressHTML}
          ${tagsHTML}
          ${actionsHTML}
        </div>
      `;
      
      // Добавляем обработчик клика
      courseCard.addEventListener('click', () => {
        emit('courseSelected', { course, progress });
        // Генерируем событие для перехода к деталям курса
        emit('viewCourseDetails', course._id);
      });
      
      this.container.appendChild(courseCard);
    });
  }
}

/**
 * Экспортируем экземпляр класса для рендеринга курсов
 */
const courseRenderer = new CourseRenderer('courses-container');
export default courseRenderer;