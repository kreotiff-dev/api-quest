// httpLogger.js - Модуль логирования HTTP-запросов для образовательных целей

const HttpLogger = (function() {
  // Приватные переменные и функции
  
  // Максимальное количество хранимых логов
  const MAX_LOGS = 100;
  
  // Массив для хранения логов
  let logs = [];
  
  // Флаг активности логирования
  let loggingEnabled = true;
  
  // Ключ для хранения логов в localStorage
  const STORAGE_KEY = 'apiQuestHttpLogs';
  
  // Типы логов
  const LOG_TYPES = {
      REQUEST: 'request',
      RESPONSE: 'response',
      ERROR: 'error'
  };
  
  // Загрузка сохраненных логов из localStorage
  function loadLogs() {
      try {
          const savedLogs = localStorage.getItem(STORAGE_KEY);
          if (savedLogs) {
              logs = JSON.parse(savedLogs);
          }
      } catch (e) {
          console.error('Ошибка при загрузке логов HTTP:', e);
          logs = [];
      }
  }
  
  // Сохранение логов в localStorage
  function saveLogs() {
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      } catch (e) {
          console.error('Ошибка при сохранении логов HTTP:', e);
      }
  }
  
  // Добавление нового лога
  function addLog(type, data, source) {
      if (!loggingEnabled) return;
      
      // Создаем запись лога
      const log = {
          id: Date.now() + Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString(),
          type,
          data,
          source: source || 'unknown'
      };
      
      // Добавляем в начало массива (новые логи вверху)
      logs.unshift(log);
      
      // Ограничиваем количество логов
      if (logs.length > MAX_LOGS) {
          logs = logs.slice(0, MAX_LOGS);
      }
      
      // Сохраняем в localStorage
      saveLogs();
      
      // Обновляем UI, если панель логов открыта
      updateLogsUI();
      
      return log;
  }
  
  // Логирование HTTP-запроса
  function logRequest(request, source) {
      return addLog(LOG_TYPES.REQUEST, {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body
      }, source);
  }
  
  // Логирование HTTP-ответа
  function logResponse(response, requestId, source) {
      return addLog(LOG_TYPES.RESPONSE, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.body,
          requestId
      }, source);
  }
  
  // Логирование ошибки HTTP
  function logError(error, requestId, source) {
      return addLog(LOG_TYPES.ERROR, {
          message: error.message,
          stack: error.stack,
          requestId
      }, source);
  }
  
  // Очистка всех логов
  function clearLogs() {
      logs = [];
      saveLogs();
      updateLogsUI();
  }
  
  // Включение/выключение логирования
  function toggleLogging(enabled) {
      loggingEnabled = enabled !== undefined ? enabled : !loggingEnabled;
      return loggingEnabled;
  }
  
  // Получение всех логов
  function getLogs() {
      return [...logs]; // Возвращаем копию массива
  }
  
  // Фильтрация логов
  function filterLogs(filters) {
      let filteredLogs = [...logs];
      
      if (filters) {
          if (filters.type) {
              filteredLogs = filteredLogs.filter(log => log.type === filters.type);
          }
          
          if (filters.source) {
              filteredLogs = filteredLogs.filter(log => log.source === filters.source);
          }
          
          if (filters.method) {
              filteredLogs = filteredLogs.filter(log => 
                  log.type === LOG_TYPES.REQUEST && 
                  log.data.method === filters.method
              );
          }
          
          if (filters.status) {
              filteredLogs = filteredLogs.filter(log => 
                  log.type === LOG_TYPES.RESPONSE && 
                  log.data.status === filters.status
              );
          }
          
          if (filters.search) {
              const searchTerm = filters.search.toLowerCase();
              filteredLogs = filteredLogs.filter(log => {
                  // Поиск в URL
                  if (log.type === LOG_TYPES.REQUEST && 
                      log.data.url.toLowerCase().includes(searchTerm)) {
                      return true;
                  }
                  
                  // Поиск в теле
                  const body = log.data.body ? JSON.stringify(log.data.body).toLowerCase() : '';
                  if (body.includes(searchTerm)) {
                      return true;
                  }
                  
                  return false;
              });
          }
      }
      
      return filteredLogs;
  }
  
  // Обновление UI панели логов, если она открыта
  function updateLogsUI() {
      const logsPanel = document.getElementById('http-logs-panel');
      if (logsPanel && logsPanel.style.display !== 'none') {
          renderLogsPanel();
      }
  }
  
  // Создание панели логов
  function createLogsPanel() {
      // Проверяем, существует ли уже панель
      let logsPanel = document.getElementById('http-logs-panel');
      
      if (!logsPanel) {
          // Создаем панель
          logsPanel = document.createElement('div');
          logsPanel.id = 'http-logs-panel';
          logsPanel.className = 'logs-panel';
          logsPanel.style.display = 'none';
          
          // Создаем заголовок панели
          const header = document.createElement('div');
          header.className = 'logs-panel-header';
          
          const title = document.createElement('h3');
          title.textContent = 'Логи HTTP-запросов';
          
          const closeBtn = document.createElement('button');
          closeBtn.className = 'logs-panel-close';
          closeBtn.innerHTML = '&times;';
          closeBtn.addEventListener('click', () => {
              logsPanel.style.display = 'none';
          });
          
          header.appendChild(title);
          header.appendChild(closeBtn);
          
          // Создаем фильтры
          const filtersContainer = document.createElement('div');
          filtersContainer.className = 'logs-panel-filters';
          
          // Фильтр по типу
          const typeFilter = document.createElement('select');
          typeFilter.className = 'logs-filter';
          typeFilter.id = 'logs-filter-type';
          
          const typeOptions = [
              { value: '', label: 'Все типы' },
              { value: LOG_TYPES.REQUEST, label: 'Запросы' },
              { value: LOG_TYPES.RESPONSE, label: 'Ответы' },
              { value: LOG_TYPES.ERROR, label: 'Ошибки' }
          ];
          
          typeOptions.forEach(option => {
              const optElem = document.createElement('option');
              optElem.value = option.value;
              optElem.textContent = option.label;
              typeFilter.appendChild(optElem);
          });
          
          typeFilter.addEventListener('change', renderLogsPanel);
          
          // Фильтр по источнику
          const sourceFilter = document.createElement('select');
          sourceFilter.className = 'logs-filter';
          sourceFilter.id = 'logs-filter-source';
          
          const sourceOptions = [
              { value: '', label: 'Все источники' },
              { value: 'mock', label: 'Симулятор API' },
              { value: 'public', label: 'Публичные API' },
              { value: 'custom', label: 'Учебный API' }
          ];
          
          sourceOptions.forEach(option => {
              const optElem = document.createElement('option');
              optElem.value = option.value;
              optElem.textContent = option.label;
              sourceFilter.appendChild(optElem);
          });
          
          sourceFilter.addEventListener('change', renderLogsPanel);
          
          // Поле поиска
          const searchInput = document.createElement('input');
          searchInput.type = 'text';
          searchInput.placeholder = 'Поиск в логах...';
          searchInput.className = 'logs-search';
          searchInput.id = 'logs-search';
          
          let searchTimeout;
          searchInput.addEventListener('input', () => {
              clearTimeout(searchTimeout);
              searchTimeout = setTimeout(renderLogsPanel, 300);
          });
          
          // Кнопки действий
          const actionsContainer = document.createElement('div');
          actionsContainer.className = 'logs-panel-actions';
          
          const clearBtn = document.createElement('button');
          clearBtn.className = 'logs-clear-btn';
          clearBtn.textContent = 'Очистить логи';
          clearBtn.addEventListener('click', clearLogs);
          
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'logs-toggle-btn';
          toggleBtn.textContent = loggingEnabled ? 'Отключить логирование' : 'Включить логирование';
          toggleBtn.addEventListener('click', () => {
              const enabled = toggleLogging();
              toggleBtn.textContent = enabled ? 'Отключить логирование' : 'Включить логирование';
          });
          
          actionsContainer.appendChild(clearBtn);
          actionsContainer.appendChild(toggleBtn);
          
          // Добавляем фильтры в контейнер
          filtersContainer.appendChild(typeFilter);
          filtersContainer.appendChild(sourceFilter);
          filtersContainer.appendChild(searchInput);
          filtersContainer.appendChild(actionsContainer);
          
          // Создаем контейнер для списка логов
          const logsContainer = document.createElement('div');
          logsContainer.className = 'logs-container';
          logsContainer.id = 'logs-container';
          
          // Собираем панель
          logsPanel.appendChild(header);
          logsPanel.appendChild(filtersContainer);
          logsPanel.appendChild(logsContainer);
          
          // Добавляем панель на страницу
          document.body.appendChild(logsPanel);
          
          // Добавляем стили
          addLogsPanelStyles();
      }
      
      return logsPanel;
  }
  
  // Отрисовка содержимого панели логов
  function renderLogsPanel() {
      const logsContainer = document.getElementById('logs-container');
      if (!logsContainer) return;
      
      // Получаем значения фильтров
      const typeFilter = document.getElementById('logs-filter-type');
      const sourceFilter = document.getElementById('logs-filter-source');
      const searchInput = document.getElementById('logs-search');
      
      const filters = {
          type: typeFilter ? typeFilter.value : '',
          source: sourceFilter ? sourceFilter.value : '',
          search: searchInput ? searchInput.value : ''
      };
      
      // Фильтруем логи
      const filteredLogs = filterLogs(filters);
      
      // Очищаем контейнер
      logsContainer.innerHTML = '';
      
      if (filteredLogs.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'logs-empty-message';
          emptyMessage.textContent = 'Нет логов для отображения';
          logsContainer.appendChild(emptyMessage);
          return;
      }
      
      // Создаем элементы для каждого лога
      filteredLogs.forEach(log => {
          const logItem = document.createElement('div');
          logItem.className = `log-item log-${log.type}`;
          logItem.dataset.id = log.id;
          
          // Заголовок лога
          const logHeader = document.createElement('div');
          logHeader.className = 'log-header';
          
          // Иконка типа
          const typeIcon = document.createElement('span');
          typeIcon.className = 'log-type-icon';
          
          if (log.type === LOG_TYPES.REQUEST) {
              typeIcon.innerHTML = '<i class="fas fa-arrow-up"></i>';
              typeIcon.title = 'Запрос';
          } else if (log.type === LOG_TYPES.RESPONSE) {
              typeIcon.innerHTML = '<i class="fas fa-arrow-down"></i>';
              typeIcon.title = 'Ответ';
          } else {
              typeIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              typeIcon.title = 'Ошибка';
          }
          
          // Время
          const timestamp = document.createElement('span');
          timestamp.className = 'log-timestamp';
          const logDate = new Date(log.timestamp);
          timestamp.textContent = logDate.toLocaleTimeString();
          timestamp.title = logDate.toLocaleString();
          
          // Источник API
          const source = document.createElement('span');
          source.className = 'log-source';
          source.textContent = log.source;
          
          // Основная информация
          const info = document.createElement('span');
          info.className = 'log-info';
          
          if (log.type === LOG_TYPES.REQUEST) {
              info.textContent = `${log.data.method} ${log.data.url}`;
          } else if (log.type === LOG_TYPES.RESPONSE) {
              info.textContent = `${log.data.status} ${log.data.statusText || ''}`;
              
              // Добавляем класс в зависимости от статуса
              if (log.data.status >= 200 && log.data.status < 300) {
                  info.classList.add('log-status-success');
              } else if (log.data.status >= 300 && log.data.status < 400) {
                  info.classList.add('log-status-redirect');
              } else if (log.data.status >= 400) {
                  info.classList.add('log-status-error');
              }
          } else {
              info.textContent = log.data.message;
              info.classList.add('log-status-error');
          }
          
          // Кнопка раскрытия деталей
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'log-toggle-btn';
          toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
          toggleBtn.title = 'Показать детали';
          
          toggleBtn.addEventListener('click', () => {
              const details = logItem.querySelector('.log-details');
              if (details.style.display === 'none') {
                  details.style.display = 'block';
                  toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                  toggleBtn.title = 'Скрыть детали';
              } else {
                  details.style.display = 'none';
                  toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                  toggleBtn.title = 'Показать детали';
              }
          });
          
          // Собираем заголовок
          logHeader.appendChild(typeIcon);
          logHeader.appendChild(timestamp);
          logHeader.appendChild(source);
          logHeader.appendChild(info);
          logHeader.appendChild(toggleBtn);
          
          // Детали лога
          const logDetails = document.createElement('div');
          logDetails.className = 'log-details';
          logDetails.style.display = 'none';
          
          if (log.type === LOG_TYPES.REQUEST || log.type === LOG_TYPES.RESPONSE) {
              // Заголовки
              if (log.data.headers) {
                  const headersTitle = document.createElement('h4');
                  headersTitle.textContent = 'Заголовки:';
                  logDetails.appendChild(headersTitle);
                  
                  const headersList = document.createElement('div');
                  headersList.className = 'log-headers';
                  
                  for (const [key, value] of Object.entries(log.data.headers)) {
                      const headerItem = document.createElement('div');
                      headerItem.className = 'log-header-item';
                      headerItem.innerHTML = `<strong>${key}:</strong> ${value}`;
                      headersList.appendChild(headerItem);
                  }
                  
                  logDetails.appendChild(headersList);
              }
              
              // Тело запроса/ответа
              if (log.data.body) {
                  const bodyTitle = document.createElement('h4');
                  bodyTitle.textContent = 'Тело:';
                  logDetails.appendChild(bodyTitle);
                  
                  const bodyContent = document.createElement('pre');
                  bodyContent.className = 'log-body';
                  
                  try {
                      // Пытаемся отформатировать JSON для лучшей читаемости
                      const bodyStr = typeof log.data.body === 'string' 
                          ? log.data.body 
                          : JSON.stringify(log.data.body, null, 2);
                      bodyContent.textContent = bodyStr;
                  } catch (e) {
                      bodyContent.textContent = String(log.data.body);
                  }
                  
                  logDetails.appendChild(bodyContent);
              }
          } else if (log.type === LOG_TYPES.ERROR) {
              // Сообщение об ошибке
              const errorMessage = document.createElement('div');
              errorMessage.className = 'log-error-message';
              errorMessage.textContent = log.data.message;
              logDetails.appendChild(errorMessage);
              
              // Стек ошибки, если есть
              if (log.data.stack) {
                  const stackTitle = document.createElement('h4');
                  stackTitle.textContent = 'Стек вызовов:';
                  logDetails.appendChild(stackTitle);
                  
                  const stackContent = document.createElement('pre');
                  stackContent.className = 'log-stack';
                  stackContent.textContent = log.data.stack;
                  logDetails.appendChild(stackContent);
              }
          }
          
          // Добавляем копирование в буфер обмена
          const copyBtn = document.createElement('button');
          copyBtn.className = 'log-copy-btn';
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать';
          copyBtn.title = 'Копировать в буфер обмена';
          
          copyBtn.addEventListener('click', () => {
              // Создаем текстовое представление лога
              let logText = '';
              
              if (log.type === LOG_TYPES.REQUEST) {
                  logText += `# Запрос (${new Date(log.timestamp).toLocaleString()})\n`;
                  logText += `${log.data.method} ${log.data.url}\n\n`;
                  
                  if (log.data.headers) {
                      logText += '## Заголовки:\n';
                      for (const [key, value] of Object.entries(log.data.headers)) {
                          logText += `${key}: ${value}\n`;
                      }
                      logText += '\n';
                  }
                  
                  if (log.data.body) {
                      logText += '## Тело запроса:\n';
                      logText += typeof log.data.body === 'string' 
                          ? log.data.body 
                          : JSON.stringify(log.data.body, null, 2);
                  }
              } else if (log.type === LOG_TYPES.RESPONSE) {
                  logText += `# Ответ (${new Date(log.timestamp).toLocaleString()})\n`;
                  logText += `${log.data.status} ${log.data.statusText || ''}\n\n`;
                  
                  if (log.data.headers) {
                      logText += '## Заголовки:\n';
                      for (const [key, value] of Object.entries(log.data.headers)) {
                          logText += `${key}: ${value}\n`;
                      }
                      logText += '\n';
                  }
                  
                  if (log.data.body) {
                      logText += '## Тело ответа:\n';
                      logText += typeof log.data.body === 'string' 
                          ? log.data.body 
                          : JSON.stringify(log.data.body, null, 2);
                  }
              } else {
                  logText += `# Ошибка (${new Date(log.timestamp).toLocaleString()})\n`;
                  logText += log.data.message + '\n\n';
                  
                  if (log.data.stack) {
                      logText += '## Стек вызовов:\n';
                      logText += log.data.stack;
                  }
              }
              
              // Копируем в буфер обмена
              navigator.clipboard.writeText(logText)
                  .then(() => {
                      UI.showNotification('Лог скопирован в буфер обмена', 'success');
                  })
                  .catch(err => {
                      console.error('Не удалось скопировать текст: ', err);
                      UI.showNotification('Не удалось скопировать текст', 'error');
                  });
          });
          
          logDetails.appendChild(copyBtn);
          
          // Собираем элемент лога
          logItem.appendChild(logHeader);
          logItem.appendChild(logDetails);
          
          // Добавляем в контейнер
          logsContainer.appendChild(logItem);
      });
  }
  
  // Отображение панели логов
  function showLogsPanel() {
      const logsPanel = createLogsPanel();
      logsPanel.style.display = 'block';
      renderLogsPanel();
  }
  
  // Скрытие панели логов
  function hideLogsPanel() {
      const logsPanel = document.getElementById('http-logs-panel');
      if (logsPanel) {
          logsPanel.style.display = 'none';
      }
  }
  
  // Добавление стилей для панели логов
  function addLogsPanelStyles() {
      // Проверяем, существуют ли уже стили
      if (document.getElementById('logs-panel-styles')) {
          return;
      }
      
      const styles = document.createElement('style');
      styles.id = 'logs-panel-styles';
      styles.textContent = `
          .logs-panel {
              position: fixed;
              top: 60px;
              right: 0;
              bottom: 0;
              width: 500px;
              background-color: white;
              box-shadow: -2px 0 5px rgba(0,0,0,0.2);
              z-index: 1000;
              display: flex;
              flex-direction: column;
              border-left: 1px solid #ddd;
          }
          
          .logs-panel-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 15px;
              background-color: #2c3e50;
              color: white;
          }
          
          .logs-panel-header h3 {
              margin: 0;
              font-size: 1.2rem;
          }
          
          .logs-panel-close {
              background: none;
              border: none;
              color: white;
              font-size: 1.5rem;
              cursor: pointer;
              padding: 0;
              line-height: 1;
          }
          
          .logs-panel-filters {
              padding: 10px 15px;
              border-bottom: 1px solid #ddd;
              background-color: #f5f5f5;
          }
          
          .logs-filter {
              padding: 5px 10px;
              margin-right: 10px;
              border: 1px solid #ddd;
              border-radius: 3px;
          }
          
          .logs-search {
              padding: 5px 10px;
              margin-right: 10px;
              border: 1px solid #ddd;
              border-radius: 3px;
              width: 150px;
          }
          
          .logs-panel-actions {
              margin-top: 10px;
              display: flex;
              gap: 10px;
          }
          
          .logs-clear-btn, .logs-toggle-btn {
              padding: 5px 10px;
              background-color: #3498db;
              color: white;
              border: none;
              border-radius: 3px;
              cursor: pointer;
          }
          
          .logs-clear-btn:hover, .logs-toggle-btn:hover {
              background-color: #2980b9;
          }
          
          .logs-container {
              flex: 1;
              overflow-y: auto;
              padding: 10px;
          }
          
          .logs-empty-message {
              text-align: center;
              padding: 20px;
              color: #999;
          }
          
          .log-item {
              margin-bottom: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
              overflow: hidden;
          }
          
          .log-request {
              border-left: 4px solid #3498db;
          }
          
          .log-response {
              border-left: 4px solid #2ecc71;
          }
          
          .log-error {
              border-left: 4px solid #e74c3c;
          }
          
          .log-header {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              background-color: #f9f9f9;
              cursor: pointer;
          }
          
          .log-type-icon {
              margin-right: 10px;
          }
          
          .log-request .log-type-icon {
              color: #3498db;
          }
          
          .log-response .log-type-icon {
              color: #2ecc71;
          }
          
          .log-error .log-type-icon {
              color: #e74c3c;
          }
          
          .log-timestamp {
              margin-right: 10px;
              color: #777;
              font-size: 0.9rem;
          }
          
          .log-source {
              margin-right: 10px;
              background-color: #f0f0f0;
              padding: 2px 5px;
              border-radius: 3px;
              font-size: 0.8rem;
          }
          
          .log-info {
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
          }
          
          .log-status-success {
              color: #2ecc71;
          }
          
          .log-status-redirect {
              color: #f39c12;
          }
          
          .log-status-error {
              color: #e74c3c;
          }
          
          .log-toggle-btn {
              background: none;
              border: none;
              cursor: pointer;
              color: #777;
              padding: 0;
          }
          
          .log-details {
              padding: 10px 15px;
              background-color: white;
              border-top: 1px solid #eee;
          }
          
          .log-details h4 {
              margin: 5px 0;
              font-size: 1rem;
          }
          
          .log-headers {
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 3px;
              margin-bottom: 10px;
          }
          
          .log-header-item {
              margin-bottom: 5px;
          }
          
          .log-body, .log-stack {
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 3px;
              overflow-x: auto;
              white-space: pre-wrap;
              font-family: monospace;
              font-size: 0.9rem;
              max-height: 200px;
              overflow-y: auto;
          }
          
          .log-error-message {
              color: #e74c3c;
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 3px;
              margin-bottom: 10px;
          }
          
          .log-copy-btn {
              background-color: #f8f9fa;
              border: 1px solid #ddd;
              border-radius: 3px;
              padding: 5px 10px;
              cursor: pointer;
              margin-top: 10px;
              display: inline-flex;
              align-items: center;
              gap: 5px;
          }
          
          .log-copy-btn:hover {
              background-color: #e9ecef;
          }
          
          @media (max-width: 768px) {
              .logs-panel {
                  width: 100%;
                  top: 50px;
              }
          }
      `;
      
      document.head.appendChild(styles);
  }
  
  // Инициализация модуля
  function init() {
      // Загружаем сохраненные логи
      loadLogs();
      
      // Добавляем кнопку для открытия панели логов, если нужно
      addLogsButton();
  }
  
// Добавление кнопки для открытия панели логов
function addLogsButton() {
  // Проверяем, существует ли уже кнопка
  if (document.getElementById('http-logs-button')) {
      return;
  }
  
  // Находим контейнер для кнопок
  const actionsContainer = document.querySelector('.content-header .actions');
  if (!actionsContainer) {
      return; // Не нашли контейнер для кнопок
  }
  
  // Создаем кнопку
  const logsButton = document.createElement('button');
  logsButton.id = 'http-logs-button';
  logsButton.className = 'btn';
  logsButton.innerHTML = '<i class="fas fa-exchange-alt"></i> HTTP Логи';
  logsButton.title = 'Показать логи HTTP-запросов';
  
  // Добавляем обработчик клика
  logsButton.addEventListener('click', () => {
      showLogsPanel();
  });
  
  // Добавляем кнопку на страницу
  actionsContainer.appendChild(logsButton);
}

// Публичное API модуля
return {
  init,
  logRequest,
  logResponse,
  logError,
  clearLogs,
  getLogs,
  filterLogs,
  toggleLogging,
  showLogsPanel,
  hideLogsPanel,
  LOG_TYPES
};
})();

// Инициализируем модуль при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
HttpLogger.init();
});

// Экспортируем модуль в глобальную область видимости
window.HttpLogger = HttpLogger;