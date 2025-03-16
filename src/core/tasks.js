/**
 * Модуль для работы с заданиями
 * @module core/tasks
 */
import taskList from '../tasks/index.js';
import { tasks as tasksData } from '../data/tasks.js';
import eventBus from './events.js';
import * as taskListUI from './task-list.js';
import { getUserProgress, markTaskAsCompleted } from '../data/user-progress.js';
import { sendRequest, getCurrentSourceInfo } from '../api/sources/index.js';
import { showNotification } from '../ui/notifications.js';

/**
 * Получение текущего задания
 * @returns {Object|null} Текущее задание или null
 */
export function getCurrentTask() {
  return window.AppMain?.getCurrentTask() || null;
}

/**
 * Загружает задания
 * @returns {Promise<void>}
 */
export async function loadTasks() {
  try {
    // Загружаем задания из модуля данных
    taskList.loadTasks(tasksData);
    console.log(`Загружено ${tasksData.length} заданий`);
    
    // Подписываемся на событие загрузки заданий для их отображения
    eventBus.on('tasksLoaded', (tasks) => {
      console.log(`Отображаем ${tasks.length} заданий`);
      // Отрисовываем список заданий после их загрузки
      taskListUI.renderTaskList();
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Ошибка при загрузке заданий:', error);
    return Promise.reject(error);
  }
}

/**
 * Проверка выполнения задания с визуальными эффектами
 */
export function checkTaskCompletion() {
  const task = getCurrentTask();
  if (!task) return;
  
  // Получение данных текущего запроса
  const method = document.getElementById('request-method')?.value;
  const url = document.getElementById('request-url')?.value;
  
  if (!method || !url) {
    showNotification('Заполните все обязательные поля запроса', 'error');
    showCustomNotification('Ошибка: заполните все обязательные поля запроса', 'error');
    return;
  }
  
  // Сбор заголовков
  const headers = {};
  document.querySelectorAll('.header-row').forEach(row => {
    const key = row.querySelector('.header-key')?.value.trim();
    const value = row.querySelector('.header-value')?.value.trim();
    
    if (key && value) {
      headers[key] = value;
    }
  });
  
  // Получение тела запроса
  let requestBody = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const bodyText = document.getElementById('request-body')?.value.trim();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (e) {
      showNotification('Ошибка в формате JSON тела запроса', 'error');
      showCustomNotification('Ошибка в формате JSON тела запроса', 'error');
      return;
    }
  }
  
  // Формируем запрос для проверки
  const request = {
    method,
    url,
    headers,
    body: requestBody
  };
  
  // Проверяем, было ли выполнено задание с использованием правильного источника API
  const currentSource = getCurrentSourceInfo();
  
  if (task.apiSourceRestrictions && !task.apiSourceRestrictions.includes(currentSource.key)) {
    showNotification(`Для этого задания требуется использовать определенный источник API: ${task.apiSourceRestrictions.join(' или ')}`, 'error');
    showCustomNotification(`Ошибка: Для этого задания требуется использовать определенный источник API: ${task.apiSourceRestrictions.join(' или ')}`, 'error');
    return;
  }
  
  // Проверка правильности запроса
  const isCorrect = checkRequestCorrectness(task, request);
  
  if (isCorrect) {
    // Дополнительная проверка ответа сервера, если требуется
    if (task.requiresServerResponse) {
      // Отправляем запрос и проверяем ответ
      showNotification('Отправка запроса для проверки решения...', 'info');
      showCustomNotification('Отправка запроса для проверки решения...', 'info');
      
      // Показываем индикатор загрузки
      const checkButton = document.getElementById('check-solution');
      if (checkButton) {
        checkButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
        checkButton.disabled = true;
      }
      
      sendRequest(request)
        .then(response => {
          // Проверяем ответ на соответствие ожидаемому
          const isResponseCorrect = checkResponseCorrectness(task, response);
          
          if (isResponseCorrect) {
            // Обновление статуса задания на "выполнено"
            const result = markTaskAsCompleted(task.id, getAllTasks());
            
            // Показываем уведомление об успешном выполнении
            showNotification('Поздравляем! Задание выполнено успешно.', 'success');
            showCustomNotification('Поздравляем! Задание выполнено успешно.', 'success');
            
            // Визуально отмечаем успешное выполнение задания
            showSuccessUI(task);
            
            // Генерируем событие проверки задания
            eventBus.emit('taskCheckSuccess', { task, result });
          } else {
            showNotification('Ответ сервера не соответствует ожидаемому. Проверьте ваш запрос.', 'error');
            showCustomNotification('Ответ сервера не соответствует ожидаемому. Проверьте ваш запрос.', 'error');
            
            // Восстанавливаем кнопку
            if (checkButton) {
              checkButton.innerHTML = '<i class="fas fa-check"></i> Проверить решение';
              checkButton.disabled = false;
              
              // Добавляем визуальный эффект ошибки
              checkButton.classList.add('btn-danger');
              setTimeout(() => {
                checkButton.classList.remove('btn-danger');
              }, 1000);
            }
            
            // Генерируем событие неудачной проверки
            eventBus.emit('taskCheckFailed', { task, response });
          }
        })
        .catch(error => {
          showNotification('Произошла ошибка при проверке решения: ' + error.message, 'error');
          showCustomNotification('Произошла ошибка при проверке решения: ' + error.message, 'error');
          
          // Восстанавливаем кнопку
          if (checkButton) {
            checkButton.innerHTML = '<i class="fas fa-check"></i> Проверить решение';
            checkButton.disabled = false;
          }
          
          // Генерируем событие ошибки
          eventBus.emit('taskCheckError', { task, error });
        });
    } else {
      // Обновление статуса задания на "выполнено" без проверки ответа
      const result = markTaskAsCompleted(task.id, getAllTasks());
      
      // Показываем уведомление об успешном выполнении
      showNotification('Поздравляем! Задание выполнено успешно.', 'success');
      showCustomNotification('Поздравляем! Задание выполнено успешно.', 'success');
      
      // Визуально отмечаем успешное выполнение задания
      showSuccessUI(task);
      
      // Генерируем событие проверки задания
      eventBus.emit('taskCheckSuccess', { task, result });
    }
  } else {
    showNotification('Запрос не соответствует требованиям задания. Попробуйте еще раз.', 'error');
    showCustomNotification('Запрос не соответствует требованиям задания. Попробуйте еще раз.', 'error');
    
    // Добавляем визуальный эффект ошибки на кнопку
    const checkButton = document.getElementById('check-solution');
    if (checkButton) {
      checkButton.classList.add('btn-danger');
      setTimeout(() => {
        checkButton.classList.remove('btn-danger');
      }, 1000);
    }
    
    // Генерируем событие неудачной проверки
    eventBus.emit('taskCheckFailed', { task, request });
  }
}

/**
 * Показать пользовательское уведомление непосредственно на странице
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления (success, error, info)
 */
function showCustomNotification(message, type = 'info') {
  // Проверяем, существует ли уже контейнер для уведомлений
  let notificationContainer = document.getElementById('custom-notifications');
  
  if (!notificationContainer) {
    // Создаем контейнер, если его нет
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'custom-notifications';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    document.body.appendChild(notificationContainer);
  }
  
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.style.backgroundColor = type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '5px';
  notification.style.marginBottom = '10px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.transition = 'all 0.3s ease';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(-20px)';
  
  // Добавляем иконку
  let icon = '';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✗';
  else icon = 'ℹ';
  
  notification.innerHTML = `<strong>${icon} </strong>${message}`;
  
  // Добавляем уведомление в контейнер
  notificationContainer.appendChild(notification);
  
  // Анимируем появление
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 300);
  }, 5000);
}

/**
 * Показать визуальные элементы успешного выполнения задания
 * @param {Object} task - Задание
 */
function showSuccessUI(task) {
  // 1. Изменяем внешний вид кнопки
  const checkButton = document.getElementById('check-solution');
  if (checkButton) {
    checkButton.className = 'btn btn-success';
    checkButton.innerHTML = '<i class="fas fa-check"></i> Задание выполнено';
    checkButton.disabled = true;
  }
  
  // 2. Создаем и показываем модальное окно с поздравлением
  const successModal = document.createElement('div');
  successModal.className = 'modal';
  successModal.style.display = 'block';
  successModal.style.position = 'fixed';
  successModal.style.zIndex = '1000';
  successModal.style.left = '0';
  successModal.style.top = '0';
  successModal.style.width = '100%';
  successModal.style.height = '100%';
  successModal.style.overflow = 'auto';
  successModal.style.backgroundColor = 'rgba(0,0,0,0.4)';
  
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#fefefe';
  modalContent.style.margin = '15% auto';
  modalContent.style.padding = '20px';
  modalContent.style.border = '1px solid #888';
  modalContent.style.width = '50%';
  modalContent.style.borderRadius = '8px';
  modalContent.style.textAlign = 'center';
  
  modalContent.innerHTML = `
    <h2 style="color: #2ecc71; margin-bottom: 20px;">Поздравляем!</h2>
    <p style="font-size: 18px; margin-bottom: 20px;">Задание "${task.title}" успешно выполнено!</p>
    <button id="close-success-modal" style="padding: 10px 20px; background-color: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;">Продолжить</button>
  `;
  
  successModal.appendChild(modalContent);
  document.body.appendChild(successModal);
  
  // Добавляем обработчик для закрытия модального окна
  document.getElementById('close-success-modal').addEventListener('click', function() {
    successModal.style.display = 'none';
    document.body.removeChild(successModal);
  });
  
  // 3. Добавляем визуальный индикатор выполнения задания
  const taskDetailsPanel = document.querySelector('.task-details-panel');
  if (taskDetailsPanel) {
    // Проверяем, нет ли уже индикатора
    if (!document.querySelector('.task-status-indicator')) {
      const taskStatus = document.createElement('div');
      taskStatus.className = 'task-status-indicator';
      taskStatus.style.backgroundColor = '#2ecc71';
      taskStatus.style.color = 'white';
      taskStatus.style.padding = '10px 15px';
      taskStatus.style.borderRadius = '4px';
      taskStatus.style.marginTop = '20px';
      taskStatus.style.textAlign = 'center';
      taskStatus.style.fontWeight = 'bold';
      taskStatus.innerHTML = '<i class="fas fa-check-circle"></i> Задание выполнено';
      
      taskDetailsPanel.appendChild(taskStatus);
    }
  }
}

/**
 * Проверка правильности запроса
 * @param {Object} task - Задание
 * @param {Object} request - Запрос
 * @returns {boolean} Результат проверки
 */
export function checkRequestCorrectness(task, request) {
  // Проверка метода
  if (task.solution && task.solution.method && request.method !== task.solution.method) {
    return false;
  }
  
  // Проверка URL
  if (task.solution && task.solution.url && request.url !== task.solution.url) {
    return false;
  }
  
  // Проверка обязательных заголовков
  if (task.solution && task.solution.headers) {
    for (const [key, value] of Object.entries(task.solution.headers)) {
      if (!request.headers[key]) {
        return false;
      }
      
      // Если для заголовка задано конкретное значение (не placeholder), проверяем его
      if (value !== true && value !== '' && request.headers[key] !== value) {
        return false;
      }
    }
  }
  
  // Проверка обязательных полей в теле запроса
  if (task.solution && task.solution.body && typeof task.solution.body === 'object' && 
      ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    for (const [key, value] of Object.entries(task.solution.body)) {
      if (!request.body || request.body[key] === undefined) {
        return false;
      }
      
      // Если задано конкретное значение (не placeholder), проверяем его
      if (value !== true && request.body[key] !== value) {
        return false;
      }
    }
  }
  
  // Для сложных задач с несколькими шагами
  if (task.solution && task.solution.steps) {
    // Здесь можно добавить дополнительную логику проверки
    // Например, сравнение с сохраненными ответами и т.д.
  }
  
  // Если все проверки пройдены, запрос считается правильным
  return true;
}

/**
 * Проверка правильности ответа сервера
 * @param {Object} task - Задание
 * @param {Object} response - Ответ сервера
 * @returns {boolean} Результат проверки
 */
export function checkResponseCorrectness(task, response) {
  // Если нет ожидаемого ответа, считаем любой ответ правильным
  if (!task.expectedResponse) {
    return true;
  }
  
  // Проверка статус-кода
  if (task.expectedResponse.status && response.status !== task.expectedResponse.status) {
    return false;
  }
  
  // Проверка заголовков
  if (task.expectedResponse.headers) {
    for (const [key, value] of Object.entries(task.expectedResponse.headers)) {
      if (!response.headers[key] || response.headers[key] !== value) {
        return false;
      }
    }
  }
  
  // Проверка тела ответа
  if (task.expectedResponse.body) {
    // Для простых проверок - полное соответствие
    if (task.expectedResponse.exactMatch) {
      return JSON.stringify(response.body) === JSON.stringify(task.expectedResponse.body);
    }
    
    // Для проверки по ключам
    if (typeof task.expectedResponse.body === 'object') {
      for (const [key, value] of Object.entries(task.expectedResponse.body)) {
        // Рекурсивная проверка по вложенным путям, например 'user.name'
        const checkNestedValue = (obj, path, expectedValue) => {
          const keys = path.split('.');
          let current = obj;
          
          for (let i = 0; i < keys.length; i++) {
            if (current[keys[i]] === undefined) {
              return false;
            }
            current = current[keys[i]];
          }
          
          return current === expectedValue || 
                 (expectedValue === true && current !== undefined);
        };
        
        if (!checkNestedValue(response.body, key, value)) {
          return false;
        }
      }
    }
  }
  
  // Если все проверки пройдены, ответ считается правильным
  return true;
}

/**
 * Получение подсказки для текущего задания
 * @returns {string|null} Текст подсказки или null
 */
export function getHint() {
  const currentTask = getCurrentTask();
  if (!currentTask) {
    console.warn('Невозможно получить подсказку: текущее задание не выбрано');
    return null;
  }
  
  // Здесь будет логика получения подсказки из workspace.js
  let hintContent = '';
  
  // Если у задания есть подсказки, показываем их
  if (currentTask.hints && currentTask.hints.length > 0) {
    // Определяем, какую подсказку показать (в зависимости от прогресса)
    const progress = getUserProgress().taskProgress[currentTask.id] || 0;
    const hintIndex = Math.min(Math.floor(progress / 30), currentTask.hints.length - 1);
    
    hintContent = currentTask.hints[hintIndex];
  } else {
    // Генерируем общую подсказку на основе решения
    hintContent = generateGenericHint(currentTask);
  }
  
  eventBus.emit('hintRequested', { task: currentTask, hint: hintContent });
  return hintContent;
}

/**
 * Генерация общей подсказки на основе решения
 * @param {Object} task - Задание
 * @returns {string} HTML-разметка подсказки
 */
export function generateGenericHint(task) {
  let hint = '<p>Для этого задания обратите внимание на следующие моменты:</p><ul>';
  
  if (task.solution) {
    if (task.solution.method) {
      hint += `<li>Используйте метод <strong>${task.solution.method}</strong></li>`;
    }
    
    if (task.solution.url) {
      hint += `<li>URL должен быть <strong>${task.solution.url}</strong></li>`;
    }
    
    if (task.solution.headers) {
      hint += '<li>Не забудьте добавить необходимые заголовки</li>';
    }
    
    if (task.solution.body && ['POST', 'PUT', 'PATCH'].includes(task.solution.method)) {
      hint += '<li>Проверьте, что все необходимые поля присутствуют в теле запроса</li>';
    }
  }
  
  // Добавляем подсказку о выборе источника API, если есть ограничения
  if (task.apiSourceRestrictions) {
    const availableSources = getCurrentSourceInfo ? 
      task.apiSourceRestrictions.map(sourceKey => {
        const source = getCurrentSourceInfo().name || sourceKey;
        return source;
      }).join(' или ') : 
      task.apiSourceRestrictions.join(' или ');
    
    hint += `<li>Для этого задания требуется использовать источник API: <strong>${availableSources}</strong></li>`;
  }
  
  hint += '</ul><p>Внимательно прочитайте описание задания и требования.</p>';
  
  return hint;
}

/**
 * Получение задания по идентификатору
 * @param {number|string} id - Идентификатор задания
 * @returns {Object|null} Задание или null
 */
export function getTaskById(id) {
  return taskList.getTaskById(id);
}

/**
 * Получение всех заданий
 * @returns {Array} Массив заданий
 */
export function getAllTasks() {
  return taskList.getAllTasks();
}

// Экспорт для обратной совместимости
export default {
  getCurrentTask,
  loadTasks,
  checkTaskCompletion,
  getHint,
  getTaskById,
  getAllTasks,
  checkRequestCorrectness,
  checkResponseCorrectness,
  generateGenericHint
};