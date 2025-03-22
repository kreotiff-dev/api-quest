/**
 * Модуль для отображения карточек заданий
 * @module tasks/renderer
 */

import { emit } from '../core/events.js';
import { getUserProgress } from '../storage/progress.js';
import { getCategoryText, getStatusText, getStatusClass } from '../data/tasks.js';

/**
 * Класс для рендеринга карточек заданий
 */
class TaskRenderer {
  /**
   * Создает экземпляр рендерера заданий
   * @param {string} containerId - ID контейнера для карточек
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.progress = getUserProgress() || {};
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
        if (methodTags.includes(tag)) {
          return tag;
        }
      }
    }
    
    // По умолчанию
    return 'GET';
  }

  /**
   * Получает техническую информацию о задании
   * @param {Object} task - Объект задания
   * @returns {string} Техническая информация
   */
  getTechInfo(task) {
    const method = this.getMethodFromTask(task);
    
    // Проверяем наличие конкретной информации в тегах
    if (task.tags && Array.isArray(task.tags)) {
      // Фильтруем HTTP методы
      const infoTags = task.tags.filter(tag => !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(tag));
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
        return '<i class="fas fa-spinner status-icon"></i>';
      case 'locked':
        return '<i class="fas fa-lock status-icon"></i>';
      default:
        return '<i class="fas fa-circle status-icon"></i>';
    }
  }

  /**
   * Рендерит список заданий в контейнер
   * @param {Array} tasks - Массив заданий для отображения
   */
  renderTasks(tasks) {
    if (!this.container) {
      console.error('Контейнер для карточек заданий не найден');
      return;
    }
    
    // Очищаем контейнер перед рендерингом
    this.container.innerHTML = '';
    
    // Если задания не переданы - выходим
    if (!tasks || tasks.length === 0) {
      this.container.innerHTML = '<div class="no-tasks">Задания не найдены</div>';
      return;
    }

    // Рендерим каждое задание
    tasks.forEach(task => {
      const method = this.getMethodFromTask(task);
      const techInfo = this.getTechInfo(task);
      const categoryText = getCategoryText(task.category);
      const statusClass = getStatusClass(task.status).replace('status-', ''); // Удаляем префикс
      const statusIcon = this.getStatusIcon(statusClass);
      
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card';
      taskCard.dataset.taskId = task.id;
      
      taskCard.innerHTML = `
        <div class="task-header">
          <span class="task-method ${method.toLowerCase()}">${method}</span>
          <span class="task-category">${categoryText}</span>
          <h3 class="task-title">${task.title}</h3>
          <h4 class="task-subtitle">${task.subtitle}</h4>
        </div>
        <div class="task-content">
          <div class="task-info">
            <div class="task-tech-info">${techInfo}</div>
            <div class="task-status ${statusClass}">
              ${statusIcon}
            </div>
          </div>
          <div class="task-actions">
            <button class="task-btn primary">Начать</button>
          </div>
        </div>
      `;
      
      // Добавляем обработчик клика
      taskCard.addEventListener('click', () => {
        emit('taskSelected', task);
      });
      
      this.container.appendChild(taskCard);
    });
  }
}

/**
 * Экспортируем экземпляр класса для рендеринга заданий
 */
const taskRenderer = new TaskRenderer('tasks-container');
export default taskRenderer;