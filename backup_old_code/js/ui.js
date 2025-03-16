// ui.js - Модуль управления пользовательским интерфейсом API-Quest

const UI = (function() {
  // Приватные переменные и функции
  
  // Отображение уведомления
  function showNotification(message, type = 'info') {
      // Создаем элемент уведомления
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      // Находим или создаем контейнер для уведомлений
      let notificationsContainer = document.getElementById('notifications-container');
      if (!notificationsContainer) {
          notificationsContainer = document.createElement('div');
          notificationsContainer.id = 'notifications-container';
          notificationsContainer.className = 'notifications-container';
          document.body.appendChild(notificationsContainer);
      }
      
      // Добавляем уведомление в контейнер
      notificationsContainer.appendChild(notification);
      
      // Автоматическое скрытие через 5 секунд
      setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
              notification.remove();
          }, 500); // Время анимации исчезновения
      }, 5000);
  }
  
  // Переключение между экранами
  function switchScreen(screen) {
      const tasksScreen = document.getElementById('tasks-screen');
      const workspaceScreen = document.getElementById('workspace-screen');
      
      if (screen === 'tasks') {
          tasksScreen.classList.add('active');
          workspaceScreen.classList.remove('active');
          window.currentScreen = 'tasks';
      } else if (screen === 'workspace') {
          tasksScreen.classList.remove('active');
          workspaceScreen.classList.add('active');
          window.currentScreen = 'workspace';
      }
  }
  
  // Открытие модального окна
  function openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
          modal.style.display = 'block';
      }
  }
  
  // Закрытие модального окна
  function closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
          modal.style.display = 'none';
      }
  }
  
  // Открытие документации API
  function openApiDocs() {
      openModal('api-docs-modal');
  }
  
  // Создание модального окна с динамическим содержимым
  function createDynamicModal(title, content, onClose = null) {
      // Проверяем, существует ли контейнер для динамических модальных окон
      let dynamicModal = document.getElementById('dynamic-modal');
      
      if (!dynamicModal) {
          // Создаем модальное окно, если его нет
          dynamicModal = document.createElement('div');
          dynamicModal.id = 'dynamic-modal';
          dynamicModal.className = 'modal';
          
          // Создаем контент модального окна
          const modalContent = document.createElement('div');
          modalContent.className = 'modal-content';
          
          // Создаем заголовок
          const modalHeader = document.createElement('div');
          modalHeader.className = 'modal-header';
          
          const modalTitle = document.createElement('h2');
          modalTitle.id = 'dynamic-modal-title';
          
          const closeBtn = document.createElement('span');
          closeBtn.className = 'modal-close';
          closeBtn.innerHTML = '&times;';
          closeBtn.onclick = function() {
              dynamicModal.style.display = 'none';
              if (onClose && typeof onClose === 'function') {
                  onClose();
              }
          };
          
          modalHeader.appendChild(modalTitle);
          modalHeader.appendChild(closeBtn);
          
          // Создаем тело модального окна
          const modalBody = document.createElement('div');
          modalBody.className = 'modal-body';
          modalBody.id = 'dynamic-modal-body';
          
          // Собираем модальное окно
          modalContent.appendChild(modalHeader);
          modalContent.appendChild(modalBody);
          dynamicModal.appendChild(modalContent);
          
          // Добавляем в body
          document.body.appendChild(dynamicModal);
          
          // Добавляем обработчик для закрытия при клике вне содержимого
          dynamicModal.onclick = function(event) {
              if (event.target === dynamicModal) {
                  dynamicModal.style.display = 'none';
                  if (onClose && typeof onClose === 'function') {
                      onClose();
                  }
              }
          };
      }
      
      // Обновляем содержимое
      document.getElementById('dynamic-modal-title').textContent = title;
      document.getElementById('dynamic-modal-body').innerHTML = '';
      
      if (typeof content === 'string') {
          document.getElementById('dynamic-modal-body').innerHTML = content;
      } else if (content instanceof HTMLElement) {
          document.getElementById('dynamic-modal-body').appendChild(content);
      }
      
      // Показываем модальное окно
      dynamicModal.style.display = 'block';
      
      // Возвращаем ссылку на модальное окно для дальнейших манипуляций
      return dynamicModal;
  }
  
  // Изменение состояния кнопки (активная/неактивная)
  function toggleButtonState(buttonId, enabled) {
      const button = document.getElementById(buttonId);
      if (button) {
          if (enabled) {
              button.removeAttribute('disabled');
              button.classList.remove('disabled');
          } else {
              button.setAttribute('disabled', 'disabled');
              button.classList.add('disabled');
          }
      }
  }
  
  // Показ/скрытие индикатора загрузки
  function toggleLoadingIndicator(containerId, show) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      if (show) {
          // Создаем индикатор загрузки, если его еще нет
          let loadingIndicator = container.querySelector('.loading-spinner');
          if (!loadingIndicator) {
              loadingIndicator = document.createElement('div');
              loadingIndicator.className = 'loading-spinner';
              container.appendChild(loadingIndicator);
          }
      } else {
          // Удаляем индикатор загрузки, если он есть
          const loadingIndicator = container.querySelector('.loading-spinner');
          if (loadingIndicator) {
              loadingIndicator.remove();
          }
      }
  }
  
  // Обновление индикатора прогресса
  function updateProgressBar(progressBarId, percentage) {
      const progressBar = document.getElementById(progressBarId);
      if (progressBar) {
          progressBar.style.width = `${percentage}%`;
      }
  }
  
  // Выделение активного элемента в группе
  function setActiveElement(elementsSelector, activeIndex) {
      const elements = document.querySelectorAll(elementsSelector);
      elements.forEach((elem, index) => {
          if (index === activeIndex) {
              elem.classList.add('active');
          } else {
              elem.classList.remove('active');
          }
      });
  }
  
  // Публичное API модуля
  return {
      showNotification,
      switchScreen,
      openModal,
      closeModal,
      openApiDocs,
      createDynamicModal,
      toggleButtonState,
      toggleLoadingIndicator,
      updateProgressBar,
      setActiveElement
  };
})();

// Экспортируем модуль в глобальную область видимости
window.UI = UI;