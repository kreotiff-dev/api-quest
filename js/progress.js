// progress.js - Модуль управления прогрессом пользователя в API-Quest

const ProgressManager = (function() {
  // Приватные переменные и функции
  
  // Ключ для хранения прогресса в localStorage
  const PROGRESS_STORAGE_KEY = 'apiQuestProgress';
  
  // Загрузка пользовательского прогресса
  function loadUserProgress() {
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      
      if (savedProgress) {
          try {
              // Загружаем сохраненный прогресс
              const loadedProgress = JSON.parse(savedProgress);
              
              // Объединяем загруженные данные с существующими из userProgress
              if (loadedProgress.taskStatuses) {
                  Object.keys(loadedProgress.taskStatuses).forEach(taskId => {
                      userProgress.taskStatuses[taskId] = loadedProgress.taskStatuses[taskId];
                  });
              }
              
              if (loadedProgress.taskProgress) {
                  Object.keys(loadedProgress.taskProgress).forEach(taskId => {
                      userProgress.taskProgress[taskId] = loadedProgress.taskProgress[taskId];
                  });
              }
              
              if (loadedProgress.courseProgress) {
                  userProgress.courseProgress = loadedProgress.courseProgress;
              }
              
          } catch (e) {
              console.error('Ошибка при загрузке прогресса:', e);
              // Используем данные по умолчанию из data.js
          }
      }
      
      // Обновляем отображение прогресса
      updateProgressDisplay();
  }
  
  // Сохранение прогресса пользователя
  function saveUserProgress() {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(userProgress));
      updateProgressDisplay();
  }
  
  // Обновление отображения прогресса
  function updateProgressDisplay() {
      // Обновляем общий прогресс курса
      const progressPercentage = userProgress.courseProgress || 0;
      document.querySelectorAll('.progress-percentage').forEach(elem => {
          elem.textContent = `${progressPercentage}%`;
      });
      
      document.querySelectorAll('.progress-fill').forEach(elem => {
          elem.style.width = `${progressPercentage}%`;
      });
  }
  
  // Обновление прогресса курса
  function updateCourseProgress() {
      const totalTasks = tasks.length;
      const completedTasks = Object.values(userProgress.taskStatuses).filter(status => status === 'completed').length;
      
      // Вычисляем процент завершения
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
      
      // Обновляем объект прогресса
      userProgress.courseProgress = progressPercentage;
      
      // Сохраняем обновленный прогресс
      saveUserProgress();
  }
  
  // Обновление прогресса задания
  function updateTaskProgress(taskId) {
      const progressPercentage = userProgress.taskProgress[taskId] || 0;
      
      document.getElementById('task-progress').textContent = `${progressPercentage}%`;
      document.getElementById('task-progress-bar').style.width = `${progressPercentage}%`;
  }
  
  // Обновление попытки задания
  function updateTaskAttempt(taskId) {
      // Обновляем количество попыток
      if (userProgress.taskStatuses[taskId] !== 'completed') {
          // Если задание еще не выполнено, устанавливаем статус "in_progress"
          userProgress.taskStatuses[taskId] = 'in_progress';
      }
      
      // Увеличиваем прогресс задания, если он меньше 100%
      if (userProgress.taskProgress[taskId] < 100) {
          userProgress.taskProgress[taskId] = Math.min(
              (userProgress.taskProgress[taskId] || 0) + 10, 
              90 // Максимум 90% до полного выполнения
          );
      }
      
      // Сохраняем прогресс
      saveUserProgress();
      
      // Обновляем отображение прогресса задания
      updateTaskProgress(taskId);
  }
  
  // Пометка задания как выполненного
  function markTaskAsCompleted(taskId) {
      // Обновляем статус "выполнено"
      userProgress.taskStatuses[taskId] = 'completed';
      userProgress.taskProgress[taskId] = 100;
      
      // Сохраняем прогресс
      saveUserProgress();
      
      // Обновляем прогресс курса
      updateCourseProgress();
      
      // Обновляем отображение прогресса задания
      updateTaskProgress(taskId);
      
      // Показываем уведомление о выполнении
      UI.showNotification('Поздравляем! Задание выполнено успешно.', 'success');
      
      // Проверяем возможность разблокировки следующих заданий
      checkTasksUnlocking();
  }
  
  // Проверяем возможность разблокировки следующих заданий
  function checkTasksUnlocking() {
      // Получаем все заблокированные задания
      const lockedTasks = tasks.filter(task => userProgress.taskStatuses[task.id] === 'locked');
      
      // Проверяем зависимости и разблокируем задания
      lockedTasks.forEach(task => {
          if (task.dependencies) {
              // Проверяем выполнение всех зависимостей
              const allDependenciesCompleted = task.dependencies.every(depId => 
                  userProgress.taskStatuses[depId] === 'completed'
              );
              
              if (allDependenciesCompleted) {
                  // Разблокируем задание
                  userProgress.taskStatuses[task.id] = 'not_started';
                  userProgress.taskProgress[task.id] = 0;
                  
                  // Показываем уведомление о разблокировке
                  UI.showNotification(`Новое задание разблокировано: ${task.title}`, 'info');
              }
          }
      });
      
      // Сохраняем прогресс
      saveUserProgress();
  }
  
  // Получение сохраненного решения задания
  function getSavedSolution(taskId) {
      return savedSolutions[taskId] || null;
  }
  
  // Сохранение текущего решения задания
  function saveCurrentSolution() {
      if (!AppMain.getCurrentTask()) return;
      
      const taskId = AppMain.getCurrentTask().id;
      
      // Получаем данные текущего запроса
      const method = document.getElementById('request-method').value;
      const url = document.getElementById('request-url').value;
      
      // Сбор заголовков
      const headers = {};
      document.querySelectorAll('.header-row').forEach(row => {
          const key = row.querySelector('.header-key').value.trim();
          const value = row.querySelector('.header-value').value.trim();
          
          if (key && value) {
              headers[key] = value;
          }
      });
      
      // Получение тела запроса
      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
              const bodyText = document.getElementById('request-body').value.trim();
              if (bodyText) {
                  body = JSON.parse(bodyText);
              }
          } catch (e) {
              console.error('Ошибка при сохранении тела запроса:', e);
          }
      }
      
      // Сохраняем решение
      savedSolutions[taskId] = { url, method, headers, body };
  }
  
  // Публичное API модуля
  return {
      loadUserProgress,
      saveUserProgress,
      updateCourseProgress,
      updateTaskProgress,
      updateTaskAttempt,
      markTaskAsCompleted,
      getSavedSolution,
      saveCurrentSolution
  };
})();

// Экспортируем модуль в глобальную область видимости
window.ProgressManager = ProgressManager;