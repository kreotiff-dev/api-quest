/**
 * Модуль для отображения заданий в контексте модуля
 * @module modules/renderer
 */

import { emit } from '../core/events.js';
import { getCategoryText, getStatusText, getStatusClass } from '../data/tasks.js';

// Локальная функция получения текста категории, если импортированная функция не работает
function getTaskCategoryText(category) {
  const categories = {
    'basics': 'Основы',
    'authentication': 'Аутентификация',
    'crud': 'CRUD операции',
    'validation': 'Валидация',
    'errors': 'Обработка ошибок',
    'security': 'Безопасность',
    'performance': 'Производительность',
    'integration': 'Интеграция',
    'testing': 'Тестирование',
    'documentation': 'Документация',
    'api': 'API',
    'rest': 'REST',
    'http': 'HTTP'
  };
  
  return categories[category] || category || 'API';
}

/**
 * Класс для рендеринга заданий модуля
 */
class ModuleTaskRenderer {
  /**
   * Создает экземпляр рендерера заданий модуля
   * @param {string} containerId - ID контейнера для заданий
   */
  constructor(containerId) {
    this.containerId = containerId;
  }

  /**
   * Получает HTTP метод из задания
   * @param {Object} task - Объект задания
   * @returns {string} HTTP метод
   */
  getMethodFromTask(task) {
    // Проверяем solution.method
    if (task.solution && task.solution.method) {
      return task.solution.method;
    }
    
    // Ищем в тегах
    if (task.tags && Array.isArray(task.tags)) {
      const methodTags = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      for (const tag of task.tags) {
        if (methodTags.includes(tag.toUpperCase())) {
          return tag.toUpperCase();
        }
      }
    }
    
    // Проверяем поле type
    if (task.type && task.type !== 'api') {
      return task.type.toUpperCase();
    }
    
    // По умолчанию
    return 'API';
  }

  /**
   * Получает техническую информацию о задании
   * @param {Object} task - Объект задания
   * @returns {string} Техническая информация
   */
  getTechInfo(task) {
    const method = this.getMethodFromTask(task);
    
    // Для не-API заданий показываем тип задания и сложность
    if (task.type && task.type !== 'api') {
      const difficulty = task.difficulty || 'medium';
      return `${task.type.toUpperCase()} · ${difficulty.toUpperCase()}`;
    }
    
    // Проверяем наличие конкретной информации в тегах
    if (task.tags && Array.isArray(task.tags)) {
      // Фильтруем HTTP методы
      const methodTags = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      const infoTags = task.tags.filter(tag => !methodTags.some(m => m.toLowerCase() === tag.toLowerCase()));
      if (infoTags.length > 0) {
        return `${method} ${infoTags[0]}`;
      }
    }
    
    // Используем URL из решения если есть
    if (task.solution && task.solution.url) {
      return `${method} ${task.solution.url.split('?')[0]}`; // Без параметров запроса
    }
    
    return method;
  }

  /**
   * Получает иконку статуса для задания
   * @param {string} status - Статус задания
   * @returns {string} HTML-код иконки
   */
  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return '<i class="fas fa-check status-icon"></i>';
      case 'in_progress':
      case 'in-progress':
        return '<i class="fas fa-spinner status-icon"></i>';
      case 'locked':
        return '<i class="fas fa-lock status-icon"></i>';
      default:
        return '<i class="fas fa-circle status-icon"></i>';
    }
  }

  /**
   * Определяет статус задания на основе прогресса
   * @param {Object} task - Объект задания
   * @param {Object} progress - Объект прогресса
   * @returns {Object} Объект с классом и текстом статуса
   */
  getTaskStatus(task, progress) {
    let statusClass = '';
    let statusText = '';
    
    console.log('Checking task status:', task._id, 'Progress:', progress);
    
    // Задание может быть заблокировано по умолчанию
    if (task.isLocked) {
      statusClass = 'locked';
      statusText = 'Заблокировано';
    } else {
      // Проверяем прогресс пользователя по заданию
      if (progress && progress.tasks) {
        // Ищем по _id или id
        const taskProgress = progress.tasks.find(tp => 
          (tp.id && (tp.id === task._id || tp.id === task.id)) || 
          (tp.task && (tp.task === task._id || tp.task === task.id))
        );
        
        console.log('Found task progress:', taskProgress);
        
        if (taskProgress) {
          if (taskProgress.completed) {
            statusClass = 'completed';
            statusText = 'Завершено';
          } else if (taskProgress.started) {
            statusClass = 'in-progress';
            statusText = 'В процессе';
          } else {
            statusClass = '';
            statusText = 'Доступно';
          }
        } else {
          // Нет прогресса по заданию
          statusClass = '';
          statusText = 'Доступно';
        }
      } else {
        // Нет данных о прогрессе
        statusClass = '';
        statusText = 'Доступно';
      }
    }
    
    console.log('Task status result:', { class: statusClass, text: statusText });
    return { class: statusClass, text: statusText };
  }

  /**
   * Рендерит список заданий модуля в контейнер
   * @param {Array} tasks - Массив заданий для отображения
   * @param {Object} progress - Объект прогресса по модулю
   */
  renderTasks(tasks, progress) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Контейнер для заданий модуля не найден: ${this.containerId}`);
      return;
    }
    
    // Очищаем контейнер перед рендерингом
    container.innerHTML = '';
    
    // Если задания не переданы - выходим
    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<div class="no-tasks">Задания не найдены</div>';
      return;
    }

    // Сортируем задания по порядку
    const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Отладочная информация
    console.log('Rendering tasks:', sortedTasks);
    
    // Рендерим каждое задание
    sortedTasks.forEach(task => {
      console.log('Processing task:', task);
      const method = this.getMethodFromTask(task);
      const techInfo = this.getTechInfo(task);
      // Используем локальную функцию, если импортированная не сработает
      let categoryText = '';
      try {
        categoryText = getCategoryText(task.category);
      } catch (e) {
        categoryText = getTaskCategoryText(task.category);
      }
      const status = this.getTaskStatus(task, progress);
      const statusIcon = this.getStatusIcon(status.class);
      
      const taskCard = document.createElement('div');
      taskCard.className = `module-task-card ${status.class}`;
      taskCard.dataset.taskId = task._id;
      
      taskCard.innerHTML = `
        <div class="module-task-header">
          <div class="module-task-title-area">
            <span class="module-task-method ${method.toLowerCase()}">${method}</span>
            <h3 class="module-task-title">${task.title}</h3>
            <h4 class="module-task-subtitle">${task.subtitle || (task.description ? task.description.substring(0, 120) + '...' : '')}</h4>
          </div>
          <div class="module-task-status ${status.class}">
            ${statusIcon}
          </div>
        </div>
        <div class="module-task-info">
          <div class="module-task-tech-info">${techInfo}</div>
          ${task.tags && task.tags.length > 0 ? 
            `<div class="module-task-category">${task.tags[0]}</div>` : 
            `<div class="module-task-category">${categoryText || 'API'}</div>`
          }
        </div>
      `;
      
      // Добавляем обработчик клика
      if (status.class !== 'locked') {
        taskCard.addEventListener('click', () => {
          emit('openModuleTask', { moduleId: task.module, taskId: task._id });
        });
      } else {
        taskCard.addEventListener('click', () => {
          // Для заблокированных заданий показываем уведомление
          emit('showNotification', {
            message: 'Сначала необходимо выполнить предыдущие задания',
            type: 'warning'
          });
        });
      }
      
      container.appendChild(taskCard);
    });
  }
}

/**
 * Экспортируем экземпляр класса для рендеринга заданий модуля
 */
const moduleTaskRenderer = new ModuleTaskRenderer('module-tasks-container');
export default moduleTaskRenderer;