// apiClient.js - Модуль для работы с API-запросами и ответами в API-Quest

const ApiClient = (function() {
  // Приватные переменные и функции
  
  // Отправка API-запроса
  async function sendApiRequest() {
      const task = AppMain.getCurrentTask();
      if (!task) return;
      
      // Получение данных запроса
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
      let requestBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
              const bodyText = document.getElementById('request-body').value.trim();
              if (bodyText) {
                  requestBody = JSON.parse(bodyText);
              }
          } catch (e) {
              showApiResponse({
                  status: 400,
                  statusText: 'Error parsing request body',
                  headers: {'Content-Type': 'application/json'},
                  body: { error: 'Invalid JSON in request body' }
              });
              return;
          }
      }
      
      // Формируем объект запроса
      const request = {
          method,
          url,
          headers,
          body: requestBody
      };
      
      // Добавляем индикатор загрузки
      document.getElementById('response-meta').innerHTML = '<div class="loading-spinner"></div>';
      document.getElementById('response-body').textContent = 'Загрузка...';
      document.getElementById('response-headers').textContent = '';
      
      try {
          // Отправляем запрос через ApiSourceManager
          const response = await ApiSourceManager.sendRequest(request);
          
          // Отображаем ответ
          showApiResponse(response);
      } catch (error) {
          // Обработка ошибок при отправке запроса
          showApiResponse({
              status: 500,
              statusText: 'Error',
              headers: {'Content-Type': 'application/json'},
              body: {
                  error: 'Ошибка при отправке запроса',
                  message: error.message
              }
          });
      }
  }
  
  // Отображение ответа
  function showApiResponse(response) {
      // Метаинформация ответа (статус)
      const responseStatus = `${response.status} ${response.statusText}`;
      const statusClass = getStatusClass(response.status);
      
      // Получаем информацию о текущем источнике API
      const sourceInfo = ApiSourceManager.getCurrentSourceInfo();
      
      document.getElementById('response-meta').innerHTML = `
          <span class="response-status ${statusClass}">${responseStatus}</span>
          <span class="response-time">Время: ${Math.floor(Math.random() * 200 + 100)} мс</span>
          <span class="response-source" title="${sourceInfo.description}">Источник: ${sourceInfo.name}</span>
      `;
      
      // Заголовки ответа
      if (response.headers) {
          let headersText = '';
          
          for (const [key, value] of Object.entries(response.headers)) {
              headersText += `${key}: ${value}\n`;
          }
          
          document.getElementById('response-headers').textContent = headersText;
      }
      
      // Тело ответа
      if (response.body !== null && response.body !== undefined) {
          try {
              const formattedJson = JSON.stringify(response.body, null, 2);
              document.getElementById('response-body').textContent = formattedJson;
              highlightSyntax('response-body');
          } catch (e) {
              document.getElementById('response-body').textContent = String(response.body);
          }
      } else {
          document.getElementById('response-body').textContent = '[Нет содержимого]';
      }
      
      // Активируем таб с телом ответа
      document.querySelector('.response-tab[data-tab="body"]').click();
  }
  
  // Получение класса для статус-кода
  function getStatusClass(status) {
      if (status >= 200 && status < 300) {
          return 'response-status-success';
      } else if (status >= 300 && status < 400) {
          return 'response-status-redirect';
      } else if (status >= 400 && status < 500) {
          return 'response-status-error';
      } else if (status >= 500) {
          return 'response-status-error';
      } else {
          return 'response-status-unknown';
      }
  }
  
  // Подсветка синтаксиса JSON
  function highlightSyntax(elementId) {
      // Базовая подсветка синтаксиса JSON (можно заменить на библиотеку)
      const element = document.getElementById(elementId);
      const text = element.textContent;
      
      // Простая подсветка ключей и значений
      let highlightedText = text.replace(
          /"([^"]+)":/g, 
          '<span class="json-key">"$1"</span>:'
      );
      
      highlightedText = highlightedText.replace(
          /: ("[^"]+")/g, 
          ': <span class="json-string">$1</span>'
      );
      
      highlightedText = highlightedText.replace(
          /: ([0-9]+)/g, 
          ': <span class="json-number">$1</span>'
      );
      
      highlightedText = highlightedText.replace(
          /: (true|false|null)/g, 
          ': <span class="json-boolean">$1</span>'
      );
      
      element.innerHTML = highlightedText;
  }
  
  // Создание строки заголовка
  function addHeaderRow(key = '', value = '') {
      const headersContainer = document.getElementById('headers-container');
      
      const headerRow = document.createElement('div');
      headerRow.className = 'header-row';
      
      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'form-control header-key';
      keyInput.placeholder = 'Ключ';
      keyInput.value = key;
      
      const valueInput = document.createElement('input');
      valueInput.type = 'text';
      valueInput.className = 'form-control header-value';
      valueInput.placeholder = 'Значение';
      valueInput.value = value;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-small btn-danger remove-btn';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener('click', () => {
          headerRow.remove();
      });
      
      headerRow.appendChild(keyInput);
      headerRow.appendChild(valueInput);
      headerRow.appendChild(removeBtn);
      
      headersContainer.appendChild(headerRow);
      
      return headerRow;
  }
  
  // Сброс запроса
  function resetRequest() {
      const task = AppMain.getCurrentTask();
      if (!task) return;
      
      // Сбрасываем поля к исходным значениям для задания
      if (task.solution) {
          // URL из задания
          if (task.solution.url) {
              document.getElementById('request-url').value = task.solution.url;
          } else {
              document.getElementById('request-url').value = '';
          }
          
          // Метод из задания
          if (task.solution.method) {
              document.getElementById('request-method').value = task.solution.method;
          }
          
          // Очистка заголовков
          document.getElementById('headers-container').innerHTML = '';
          
          // Добавление заголовков из решения, если они есть
          if (task.solution.headers) {
              for (const [key, value] of Object.entries(task.solution.headers)) {
                  addHeaderRow(key, '');
              }
          } else {
              // Добавление пустого заголовка
              addHeaderRow();
          }
          
          // Сброс тела запроса
          const requestBody = document.getElementById('request-body');
          
          if (task.solution.body && typeof task.solution.body === 'object') {
              // Если тело запроса - объект с "placeholder" значениями (true)
              const templateBody = {};
              
              for (const [key, value] of Object.entries(task.solution.body)) {
                  if (value === true) {
                      // Если значение true, это placeholder
                      templateBody[key] = "";
                  } else {
                      // Иначе используем фиксированное значение
                      templateBody[key] = value;
                  }
              }
              
              requestBody.value = JSON.stringify(templateBody, null, 2);
          } else {
              requestBody.value = '';
          }
          
          // Обновляем интерфейс в зависимости от метода
          Workspace.setupApiClientInterface(task);
      } else {
          // Если нет решения, просто очищаем все поля
          document.getElementById('request-url').value = '';
          document.getElementById('headers-container').innerHTML = '';
          document.getElementById('request-body').value = '';
          addHeaderRow();
      }
      
      // Очищаем поля ответа
      document.getElementById('response-meta').textContent = '';
      document.getElementById('response-body').textContent = 'Отправьте запрос, чтобы увидеть ответ';
      document.getElementById('response-headers').textContent = '';
  }
  
  // Форматирование JSON-тела запроса
  function formatJsonBody() {
      const requestBodyTextarea = document.getElementById('request-body');
      const jsonText = requestBodyTextarea.value.trim();
      
      if (jsonText) {
          try {
              const formattedJson = JSON.stringify(JSON.parse(jsonText), null, 2);
              requestBodyTextarea.value = formattedJson;
          } catch (e) {
              UI.showNotification('Ошибка в формате JSON', 'error');
          }
      }
  }
  
  // Переключение источника API
  function switchApiSource(sourceKey) {
      if (ApiSourceManager.setApiSource(sourceKey)) {
          UI.showNotification(`Источник API переключен на ${ApiSourceManager.getCurrentSourceInfo().name}`, 'info');
      } else {
          UI.showNotification('Не удалось переключить источник API', 'error');
      }
  }
  
  // Инициализация модуля
  function init() {
      // Добавляем кнопку для быстрого переключения источника API в панель инструментов
      const actionsContainer = document.querySelector('.content-header .actions');
      if (actionsContainer) {
          const sourceButton = document.createElement('button');
          sourceButton.className = 'btn btn-source-selector';
          sourceButton.innerHTML = '<i class="fas fa-server"></i> Источник API';
          sourceButton.addEventListener('click', toggleSourceSelector);
          
          actionsContainer.appendChild(sourceButton);
      }
  }
  
  // Показать/скрыть выпадающий список источников API
  function toggleSourceSelector() {
      let sourceDropdown = document.getElementById('api-source-dropdown');
      
      if (sourceDropdown) {
          sourceDropdown.classList.toggle('show');
      } else {
          createSourceDropdown();
      }
  }
  
  // Создание выпадающего списка источников API
  function createSourceDropdown() {
      const dropdown = document.createElement('div');
      dropdown.id = 'api-source-dropdown';
      dropdown.className = 'api-source-dropdown';
      
      const sources = ApiSourceManager.getAvailableSources();
      const currentSource = ApiSourceManager.getCurrentSourceInfo();
      
      // Заголовок выпадающего списка
      const dropdownHeader = document.createElement('div');
      dropdownHeader.className = 'dropdown-header';
      dropdownHeader.textContent = 'Выберите источник API';
      dropdown.appendChild(dropdownHeader);
      
      // Список источников
      sources.forEach(source => {
          const sourceItem = document.createElement('div');
          sourceItem.className = 'dropdown-item';
          
          if (source.key === currentSource.key) {
              sourceItem.classList.add('active');
          }
          
          sourceItem.textContent = source.name;
          sourceItem.title = source.description;
          
          sourceItem.addEventListener('click', function() {
              switchApiSource(source.key);
              dropdown.classList.remove('show');
          });
          
          dropdown.appendChild(sourceItem);
      });
      
      // Добавляем выпадающий список на страницу
      document.body.appendChild(dropdown);
      
      // Показываем список
      dropdown.classList.add('show');
      
      // Закрытие списка при клике вне его
      document.addEventListener('click', function closeDropdown(e) {
          if (!dropdown.contains(e.target) && e.target.className !== 'btn-source-selector' && 
              !e.target.closest('.btn-source-selector')) {
              dropdown.classList.remove('show');
              document.removeEventListener('click', closeDropdown);
          }
      });
      
      // Позиционирование списка
      const buttonRect = document.querySelector('.btn-source-selector').getBoundingClientRect();
      dropdown.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
      dropdown.style.left = `${buttonRect.left + window.scrollX}px`;
  }
  
  // Публичное API модуля
  return {
      sendApiRequest,
      showApiResponse,
      addHeaderRow,
      resetRequest,
      formatJsonBody,
      switchApiSource,
      init,
      resetRequest,
      formatJsonBody,
      switchApiSource,
      init
  };
})();

// Экспортируем модуль в глобальную область видимости
window.ApiClient = ApiClient;