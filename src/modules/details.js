/**
 * Модуль для отображения деталей модуля курса
 * @module modules/details
 */

import { emit } from '../core/events.js';
import courseDetails from '../courses/details.js';
import { showNotification } from '../ui/notifications.js';
import moduleTaskRenderer from './renderer.js';

// URL API для модулей
const API_URL = 'http://localhost:3000/api/modules';

/**
 * Класс для отображения деталей модуля
 */
class ModuleDetails {
  /**
   * Создает экземпляр отображения деталей модуля
   * @param {string} containerId - ID контейнера для деталей модуля
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentModule = null;
    this.currentCourseId = null;
    this.moduleProgress = null;
  }

  /**
   * Инициализирует контейнер, если он не существует
   * @private
   */
  initContainer() {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
      
      if (!this.container) {
        console.log('Создание контейнера для деталей модуля');
        
        const mainContent = document.querySelector('#tasks-screen .main-content');
        if (!mainContent) {
          console.error('Не найден элемент main-content для добавления контейнера деталей модуля');
          return false;
        }
        
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'module-details';
        this.container.style.display = 'none';
        
        mainContent.appendChild(this.container);
      }
    }
    return true;
  }

  /**
   * Загружает и отображает модуль
   * @param {string} moduleId - ID модуля
   * @param {string} courseId - ID курса, которому принадлежит модуль
   */
  async loadModule(moduleId, courseId) {
    if (!this.initContainer()) return;
    
    try {
      console.log(`Загрузка модуля ${moduleId} для курса ${courseId}`);
      this.currentCourseId = courseId;
      
      // Загружаем модуль
      const module = await this.fetchModule(moduleId);
      if (!module) {
        console.error('Не удалось загрузить данные модуля');
        return;
      }
      
      console.log('Модуль успешно загружен:', module);
      this.currentModule = module;
      
      // Загружаем задания модуля
      console.log(`Загрузка заданий для модуля ${moduleId}`);
      const tasks = await this.fetchModuleTasks(moduleId);
      console.log('Задания успешно загружены:', tasks);
      
      // Загружаем прогресс пользователя по модулю
      console.log(`Загрузка прогресса для модуля ${moduleId}`);
      this.moduleProgress = await this.fetchModuleProgress(moduleId);
      console.log('Прогресс успешно загружен:', this.moduleProgress);
      
      // Отображаем детали модуля
      console.log('Отображение деталей модуля');
      this.renderModuleDetails(module, tasks, this.moduleProgress);
      
      // Отображаем контейнер
      this.container.style.display = 'block';
      
      // Генерируем событие
      emit('moduleDetailsLoaded', { module, tasks, progress: this.moduleProgress });
      console.log('Событие moduleDetailsLoaded отправлено');
      
    } catch (error) {
      console.error('Ошибка при загрузке деталей модуля:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      showNotification('Не удалось загрузить детали модуля', 'error');
    }
  }

  /**
   * Получает данные модуля с сервера
   * @param {string} moduleId - ID модуля
   * @returns {Promise<Object>} - Объект модуля
   * @private
   */
  async fetchModule(moduleId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      showNotification('Необходима авторизация', 'error');
      return null;
    }
    
    console.log(`Отправка запроса на ${API_URL}/${moduleId}`);
    
    try {
      const response = await fetch(`${API_URL}/${moduleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Проверяем, что ответ действительно JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type ответа модуля:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Ответ не является JSON:', text.substring(0, 500) + '...');
        throw new Error('Неверный формат ответа от сервера, ожидался JSON');
      }
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ошибка при получении модуля: ${response.status} ${error}`);
      }
      
      const data = await response.json();
      console.log('Полученные данные модуля:', data);
      return data.data;
    } catch (fetchError) {
      console.error('Ошибка при получении модуля:', fetchError);
      throw fetchError;
    }
  }

  /**
   * Получает задания модуля с сервера
   * @param {string} moduleId - ID модуля
   * @returns {Promise<Array>} - Массив заданий
   * @private
   */
  async fetchModuleTasks(moduleId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      showNotification('Необходима авторизация', 'error');
      return [];
    }
    
    console.log(`Отправка запроса на ${API_URL}/${moduleId}/tasks`);
    
    try {
      const response = await fetch(`${API_URL}/${moduleId}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Проверяем, что ответ действительно JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type ответа:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Ответ не является JSON:', await response.text());
        throw new Error('Неверный формат ответа от сервера, ожидался JSON');
      }
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Ошибка при получении заданий: ${response.status} ${error}`);
      return [];
    }
    
    const data = await response.json();
    console.log('Полученные данные заданий:', data);
    return data.data || [];
    
    } catch (fetchError) {
      console.error('Ошибка при выполнении fetch запроса:', fetchError);
      return [];
    }
  }

  /**
   * Получает прогресс пользователя по модулю
   * @param {string} moduleId - ID модуля
   * @returns {Promise<Object>} - Объект прогресса
   * @private
   */
  async fetchModuleProgress(moduleId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      return null;
    }
    
    console.log(`Отправка запроса на ${API_URL}/${moduleId}/progress`);
    
    try {
      const response = await fetch(`${API_URL}/${moduleId}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Проверяем HTTP-статус
      if (!response.ok) {
        // Если ошибка 404, значит просто нет прогресса
        if (response.status === 404) {
          console.log('Прогресс не найден (статус 404), возвращаем пустой прогресс');
          return { 
            started: false,
            completed: false,
            completionPercentage: 0,
            tasks: []
          };
        }
        
        const error = await response.text();
        console.error(`Ошибка при получении прогресса: ${response.status} ${error}`);
        return null;
      }
      
      // Проверяем, что ответ действительно JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type ответа прогресса:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Ответ не является JSON:', text.substring(0, 500) + '...');
        throw new Error('Неверный формат ответа от сервера, ожидался JSON');
      }
      
      const data = await response.json();
      console.log('Полученные данные прогресса:', data);
      return data.data;
      
    } catch (fetchError) {
      console.error('Ошибка при получении прогресса модуля:', fetchError);
      return {
        started: false,
        completed: false,
        completionPercentage: 0,
        tasks: []
      };
    }
  }

  /**
   * Отображает детали модуля
   * @param {Object} module - Объект модуля
   * @param {Array} tasks - Массив заданий модуля
   * @param {Object} progress - Объект прогресса
   * @private
   */
  renderModuleDetails(module, tasks, progress) {
    if (!this.container) return;
    
    // Определяем статус модуля
    const isStarted = progress && progress.started;
    const isCompleted = progress && progress.completed;
    const completionPercentage = progress ? progress.completionPercentage || 0 : 0;
    
    // Очищаем контейнер
    this.container.innerHTML = '';
    
    // Навигация по курсу
    const courseNavHTML = this.createCourseNavigationHTML();
    
    // Верхняя секция с информацией о модуле
    const moduleInfoHTML = this.createModuleInfoHTML(module, isCompleted, completionPercentage);
    
    // Секция заданий
    const tasksHTML = this.createTasksListHTML(tasks, progress);
    
    // Собираем весь HTML
    this.container.innerHTML = `
      ${courseNavHTML}
      ${moduleInfoHTML}
      ${tasksHTML}
    `;
    
    // Добавляем обработчики событий
    this.addEventListeners();
    
    // Инициализируем рендерер заданий
    if (tasks && tasks.length > 0) {
      moduleTaskRenderer.renderTasks(tasks, progress);
    }
  }

  /**
   * Создает HTML для навигации по курсу
   * @returns {string} - HTML разметка
   * @private
   */
  createCourseNavigationHTML() {
    return `
      <div class="course-navigation">
        <div class="course-navigation-item" id="back-to-course-btn">
          <i class="fas fa-arrow-left"></i>
          <span>Назад к курсу</span>
        </div>
      </div>
    `;
  }

  /**
   * Создает HTML с информацией о модуле
   * @param {Object} module - Объект модуля
   * @param {boolean} isCompleted - Завершен ли модуль
   * @param {number} completionPercentage - Процент выполнения модуля
   * @returns {string} - HTML разметка
   * @private
   */
  createModuleInfoHTML(module, isCompleted, completionPercentage) {
    const difficulty = module.difficulty || 'beginner';
    
    return `
      <div class="module-header-info">
        <div class="module-title-row">
          <h1 class="module-main-title">${module.title || module.name}</h1>
          <span class="module-difficulty ${difficulty}">${this.getDifficultyText(difficulty)}</span>
        </div>
        
        <p class="module-description">${module.description}</p>
        
        <div class="module-meta">
          <div class="meta-item">
            <i class="fas fa-tasks"></i>
            <span>${module.tasksCount || (module.tasks ? module.tasks.length : 0)} заданий</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-clock"></i>
            <span>${module.duration || 0} часов</span>
          </div>
          ${module.tags && module.tags.length > 0 ? `
          <div class="meta-item">
            <i class="fas fa-tags"></i>
            <span>${module.tags.join(', ')}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="module-actions">
          <button class="module-btn primary" id="start-module-btn">
            ${completionPercentage > 0 ? 'Продолжить модуль' : 'Начать модуль'}
          </button>
          <button class="module-btn secondary" id="back-to-course-btn-alt">Назад к курсу</button>
        </div>
        
        <div class="module-progress-block">
          <div class="progress-header">
            <span class="progress-title">Прогресс</span>
            <span class="progress-percentage">${completionPercentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPercentage}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Создает HTML со списком заданий модуля
   * @param {Array} tasks - Массив заданий
   * @param {Object} progress - Объект прогресса
   * @returns {string} - HTML разметка
   * @private
   */
  createTasksListHTML(tasks, progress) {
    if (!tasks || tasks.length === 0) {
      return '<div class="tasks-section"><h2 class="section-title">Задания</h2><p>В этом модуле пока нет заданий</p></div>';
    }
    
    return `
      <div class="tasks-section">
        <h2 class="section-title">Задания модуля</h2>
        <div class="module-tasks-list" id="module-tasks-container"></div>
      </div>
    `;
  }

  /**
   * Добавляет обработчики событий
   * @private
   */
  addEventListeners() {
    // Кнопка "Назад к курсу"
    const backBtn = this.container.querySelector('#back-to-course-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.backToCourse();
      });
    }
    
    // Альтернативная кнопка "Назад к курсу"
    const backBtnAlt = this.container.querySelector('#back-to-course-btn-alt');
    if (backBtnAlt) {
      backBtnAlt.addEventListener('click', () => {
        this.backToCourse();
      });
    }
    
    // Кнопка "Начать/Продолжить модуль"
    const startBtn = this.container.querySelector('#start-module-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startModule();
      });
    }
  }

  /**
   * Возвращает к деталям курса
   * @private
   */
  backToCourse() {
    this.hide();
    
    if (this.currentCourseId) {
      emit('viewCourseDetails', this.currentCourseId);
    } else {
      emit('backToCoursesList');
    }
  }

  /**
   * Начинает прохождение модуля
   * @private
   */
  startModule() {
    if (!this.currentModule) return;
    
    // Находим первое доступное задание
    const firstTask = document.querySelector('#module-tasks-container .module-task-card:not(.locked)');
    if (firstTask) {
      const taskId = firstTask.dataset.taskId;
      this.openTask(taskId);
    } else {
      showNotification('Не найдено доступных заданий для прохождения', 'warning');
    }
  }

  /**
   * Открывает задание модуля
   * @param {string} taskId - ID задания
   * @private
   */
  openTask(taskId) {
    console.log(`Открытие задания ${taskId}`);
    emit('openModuleTask', { moduleId: this.currentModule._id, taskId });
  }

  /**
   * Скрывает контейнер с деталями модуля
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Показывает контейнер с деталями модуля
   */
  show() {
    if (!this.initContainer()) return;
    this.container.style.display = 'block';
  }

  /**
   * Получает текст для уровня сложности
   * @param {string} difficulty - Уровень сложности
   * @returns {string} - Текст на русском
   * @private
   */
  getDifficultyText(difficulty) {
    const difficulties = {
      'beginner': 'Начальный',
      'easy': 'Легкий',
      'intermediate': 'Средний',
      'advanced': 'Продвинутый',
      'expert': 'Эксперт'
    };
    
    return difficulties[difficulty] || 'Начальный';
  }
}

/**
 * Экспортируем экземпляр класса для отображения деталей модуля
 */
const moduleDetails = new ModuleDetails('module-details-container');
export default moduleDetails;