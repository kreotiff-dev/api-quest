// apiClient.js - Модуль для работы с API-запросами и ответами в API-Quest

const ApiClient = (function() {
  // Приватные переменные и функции
  
  // Отправка API-запроса
  function sendApiRequest() {
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
                  status: 0,
                  statusText: 'Error parsing request body',
                  headers: {},
                  body: { error: 'Invalid JSON in request body' }
              });
              return;
          }
      }
      
      // Создаем ключ запроса для поиска в моках
      let requestKey = `${method}:${url}`;
      
      // Для запросов к защищенным ресурсам добавляем API-ключ
      if (url.includes('/api/secure-data') && headers['X-API-Key']) {
          requestKey += `/${headers['X-API-Key']}`;
      }
      
      // Специальная обработка для запросов с пустым телом
      if (['POST', 'PUT', 'PATCH'].includes(method) && (!requestBody || Object.keys(requestBody).length === 0)) {
          requestKey += '/empty';
      }
      
      // Добавляем индикатор загрузки
      document.getElementById('response-meta').innerHTML = '<div class="loading-spinner"></div>';
      document.getElementById('response-body').textContent = 'Загрузка...';
      document.getElementById('response-headers').textContent = '';
      
      // Эмуляция задержки сети
      setTimeout(() => {
          // Проверяем наличие мока для данного запроса
          if (apiResponses[requestKey]) {
              let response = apiResponses[requestKey];
              
              // Для POST/PUT запросов подставляем данные из тела запроса
              if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody && response.body) {
                  response = JSON.parse(JSON.stringify(response)); // Клонируем объект ответа
                  
                  // Заменяем плейсхолдеры на значения из запроса
                  if (typeof response.body === 'object') {
                      for (const key in response.body) {
                          if (typeof response.body[key] === 'string' && response.body[key].startsWith('{') && response.body[key].endsWith('}')) {
                              const placeholder = response.body[key].substring(1, response.body[key].length - 1);
                              
                              if (placeholder === 'currentDate') {
                                  response.body[key] = new Date().toISOString();
                              } else if (requestBody[placeholder] !== undefined) {
                                  response.body[key] = requestBody[placeholder];
                              }
                          }
                      }
                  }
              }
              
              // Отображаем ответ
              showApiResponse(response);
              
              // Сохраняем решение
              ProgressManager.saveCurrentSolution();
              
              // Обновляем прогресс задания
              ProgressManager.updateTaskAttempt(task.id);
              
          } else {
              // Если мок не найден, возвращаем ошибку 404
              showApiResponse({
                  status: 404,
                  statusText: 'Not Found',
                  headers: {
                      'Content-Type': 'application/json',
                      'Server': 'API Simulator'
                  },
                  body: {
                      error: 'Not Found',
                      message: 'Запрашиваемый ресурс не найден',
                      requestKey: requestKey
                  }
              });
          }
      }, 800); // Эмуляция задержки сети
  }
  
  // Отображение ответа
  function showApiResponse(response) {
      // Метаинформация ответа (статус)
      const responseStatus = `${response.status} ${response.statusText}`;
      const statusClass = getStatusClass(response.status);
      
      document.getElementById('response-meta').innerHTML = `
          <span class="response-status ${statusClass}">${responseStatus}</span>
          <span class="response-time">Время: ${Math.floor(Math.random() * 200 + 100)} мс</span>
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
          return 'status-success';
      } else if (status >= 300 && status < 400) {
          return 'status-redirect';
      } else if (status >= 400 && status < 500) {
          return 'status-client-error';
      } else if (status >= 500) {
          return 'status-server-error';
      } else {
          return 'status-unknown';
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
  
  // Публичное API модуля
  return {
      sendApiRequest,
      showApiResponse,
      addHeaderRow,
      resetRequest,
      formatJsonBody
  };
})();

// Экспортируем модуль в глобальную область видимости
window.ApiClient = ApiClient;