// taskList.js - Модуль управления списком заданий в API-Quest

const TaskList = (function() {
  // Приватные переменные и функции
  
  // Отрисовка списка заданий
  function renderTaskList(filteredTasks = null) {
      const tasksContainer = document.getElementById('tasks-container');
      const tasksToRender = filteredTasks || tasks;
      
      // Очистка контейнера
      tasksContainer.innerHTML = '';
      
      // Создание и добавление карточек заданий
      tasksToRender.forEach(task => {
          const taskCard = createTaskCard(task);
          tasksContainer.appendChild(taskCard);
      });
      
      // Обновляем прогресс
      ProgressManager.updateCourseProgress();
  }
  
  // Создание карточки задания
  function createTaskCard(task) {
      const card = document.createElement('div');
      card.className = `task-card ${task.difficulty} ${userProgress.taskStatuses[task.id]}`;
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
      
      if (userProgress.taskStatuses[task.id] === 'completed') {
          statusIcon.className += ' fa-check-circle';
          statusIcon.title = 'Выполнено';
      } else if (userProgress.taskStatuses[task.id] === 'in_progress') {
          statusIcon.className += ' fa-spinner';
          statusIcon.title = 'В процессе';
      } else if (userProgress.taskStatuses[task.id] === 'locked') {
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
          if (userProgress.taskStatuses[task.id] === 'locked') {
              UI.showNotification('Это задание пока заблокировано. Выполните предыдущие задания, чтобы разблокировать его.', 'warning');
              return;
          }
          
          // Открываем задание
          loadTask(task.id);
      });
      
      return card;
  }
  
  // Загрузка задания
  function loadTask(taskId) {
      const task = tasks.find(t => t.id === parseInt(taskId));
      
      if (!task) {
          console.error('Задание не найдено:', taskId);
          return;
      }
      
      // Устанавливаем текущую задачу в глобальном контексте
      AppMain.setCurrentTask(task);
      
      // Передаем управление модулю Workspace
      Workspace.setupTaskWorkspace(task);
      
      // Переключаем экран на рабочую область
      UI.switchScreen('workspace');
  }
  
  // Инициализация фильтров
  function initFilters() {
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
      document.getElementById('reset-filters').addEventListener('click', resetFilters);
  }
  
  // Сброс фильтров
  function resetFilters() {
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
  
  // Применение фильтров
  function applyFilters() {
      // Получаем значения активных фильтров
      const categoryFilter = document.querySelector('[data-filter="category"] .filter-option.active').dataset.value;
      const difficultyFilter = document.querySelector('[data-filter="difficulty"] .filter-option.active').dataset.value;
      const statusFilter = document.querySelector('[data-filter="status"] .filter-option.active').dataset.value;
      
      // Фильтрация задач
      const filteredTasks = tasks.filter(task => {
          // Фильтр по категории
          if (categoryFilter !== 'all' && task.category !== categoryFilter) {
              return false;
          }
          
          // Фильтр по сложности
          if (difficultyFilter !== 'all' && task.difficulty !== difficultyFilter) {
              return false;
          }
          
          // Фильтр по статусу
          if (statusFilter !== 'all' && userProgress.taskStatuses[task.id] !== statusFilter) {
              return false;
          }
          
          return true;
      });
      
      // Отрисовка отфильтрованных задач
      renderTaskList(filteredTasks);
  }
  
  // Публичное API модуля
  return {
      renderTaskList,
      loadTask,
      initFilters,
      resetFilters,
      applyFilters
  };
})();

// Экспортируем модуль в глобальную область видимости
window.TaskList = TaskList;