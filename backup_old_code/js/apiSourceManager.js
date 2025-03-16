// apiSourceManager.js - Модуль управления источниками API в API-Quest

const ApiSourceManager = (function() {
  // Приватные переменные и функции
  
  // Доступные источники API
  const apiSources = {
      mock: {
          name: "Симулятор API",
          description: "Локальные моки для обучения без внешних зависимостей",
          isAvailable: true, // Моки всегда доступны
          priority: 1        // Высший приоритет для образовательных целей
      },
      public: {
          name: "Публичные API",
          description: "Набор бесплатных публичных API для практики",
          isAvailable: false, // Будет проверено при инициализации
          priority: 2         // Средний приоритет
      },
      custom: {
          name: "Учебный API",
          description: "Собственный API платформы с расширенными возможностями",
          isAvailable: false, // Будет проверено при инициализации
          priority: 3         // Низкий приоритет (используется при доступности)
      }
  };
  
  // Текущий выбранный источник API
  let currentSource = 'mock';
  
  // Базовые URL для разных источников
  const apiBaseUrls = {
      public: 'https://public-api-quest.example.com',
      custom: 'https://api-quest.example.com/api'
  };
  
  // Адаптеры для преобразования запросов и ответов
  const apiAdapters = {
      // Адаптер для мок-данных
      mock: {
          processRequest: function(request) {
              // Для моков просто возвращаем исходный запрос
              return request;
          },
          processResponse: function(response) {
              // Для моков просто возвращаем исходный ответ
              return response;
          },
          sendRequest: function(request) {
            // Имитация задержки сети
            return new Promise((resolve) => {
                // Логируем детали обработки запроса
                if (window.HttpLogger) {
                    console.log('Обработка запроса в mock адаптере:', request.method, request.url);
                }
                
                setTimeout(() => {
                    // Создаем ключ запроса для поиска в моках
                    let requestKey = `${request.method}:${request.url}`;
                    
                    // Для запросов к защищенным ресурсам добавляем API-ключ
                    if (request.url.includes('/api/secure-data') && request.headers['X-API-Key']) {
                        requestKey += `/${request.headers['X-API-Key']}`;
                    }
                    
                    // Специальная обработка для запросов с пустым телом
                    if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
                        (!request.body || Object.keys(request.body).length === 0)) {
                        requestKey += '/empty';
                    }
                    
                    // Проверяем наличие мока для данного запроса
                    if (apiResponses[requestKey]) {
                        let response = JSON.parse(JSON.stringify(apiResponses[requestKey]));
                        
                        // Для POST/PUT запросов подставляем данные из тела запроса
                        if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
                            request.body && response.body) {
                            
                            // Заменяем плейсхолдеры на значения из запроса
                            if (typeof response.body === 'object') {
                                for (const key in response.body) {
                                    if (typeof response.body[key] === 'string' && 
                                        response.body[key].startsWith('{') && 
                                        response.body[key].endsWith('}')) {
                                        
                                        const placeholder = response.body[key].substring(1, response.body[key].length - 1);
                                        
                                        if (placeholder === 'currentDate') {
                                            response.body[key] = new Date().toISOString();
                                        } else if (request.body[placeholder] !== undefined) {
                                            response.body[key] = request.body[placeholder];
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Логируем найденный ответ
                        if (window.HttpLogger) {
                            console.log('Найден ответ в моке:', requestKey);
                        }
                        
                        resolve(response);
                    } else {
                        // Если мок не найден, возвращаем ошибку 404
                        if (window.HttpLogger) {
                            console.log('Мок не найден для запроса:', requestKey);
                        }
                        
                        resolve({
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
            });
          }
      },
      
      // Адаптер для публичных API
      public: {
          processRequest: function(request) {
              // Копируем запрос для модификации
              const processedRequest = JSON.parse(JSON.stringify(request));
              
              // Преобразуем URL для публичных API
              if (!processedRequest.url.startsWith('http')) {
                  processedRequest.url = apiBaseUrls.public + processedRequest.url;
              }
              
              // Добавляем заголовок для идентификации платформы
              processedRequest.headers['X-API-Quest-Client'] = 'Public';
              
              return processedRequest;
          },
          processResponse: function(response) {
              // Стандартизация ответа от публичного API
              const processedResponse = {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                  body: response.data
              };
              
              return processedResponse;
          },
          sendRequest: async function(request) {
            // Преобразуем запрос для публичного API
            const processedRequest = this.processRequest(request);
            
            // Логируем обработку запроса
            if (window.HttpLogger) {
                console.log('Public адаптер обрабатывает запрос:', processedRequest.url);
            }
            
            try {
                // Отправляем запрос через Fetch API
                const response = await fetch(processedRequest.url, {
                    method: processedRequest.method,
                    headers: processedRequest.headers,
                    body: processedRequest.body ? JSON.stringify(processedRequest.body) : undefined
                });
                
                // Получаем данные ответа
                const data = await response.json();
                
                // Формируем объект ответа
                const responseObj = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: data
                };
                
                return this.processResponse(responseObj);
            } catch (error) {
                // Логируем ошибку
                if (window.HttpLogger) {
                    console.error('Ошибка в public адаптере:', error.message);
                }
                
                // В случае ошибки возвращаем специальный ответ
                return {
                    status: 500,
                    statusText: 'Error',
                    headers: {'Content-Type': 'application/json'},
                    body: {
                        error: 'Ошибка при обращении к публичному API',
                        message: error.message,
                        source: 'public'
                    }
                };
            }
          }
      },
      
      // Адаптер для собственного API
      custom: {
          processRequest: function(request) {
              // Копируем запрос для модификации
              const processedRequest = JSON.parse(JSON.stringify(request));
              
              // Преобразуем URL для собственного API
              if (!processedRequest.url.startsWith('http')) {
                  processedRequest.url = apiBaseUrls.custom + processedRequest.url;
              }
              
              // Добавляем заголовки авторизации для собственного API
              processedRequest.headers['X-API-Quest-Auth'] = sessionStorage.getItem('apiQuestAuthToken') || '';
              
              return processedRequest;
          },
          processResponse: function(response) {
              // Стандартизация ответа от собственного API
              const processedResponse = {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                  body: response.data
              };
              
              // Если в ответе есть токен авторизации, сохраняем его
              if (response.headers['x-api-quest-auth-token']) {
                  sessionStorage.setItem('apiQuestAuthToken', response.headers['x-api-quest-auth-token']);
              }
              
              return processedResponse;
          },
          sendRequest: async function(request) {
              // Преобразуем запрос для собственного API
              const processedRequest = this.processRequest(request);
              
              try {
                  // Отправляем запрос через Fetch API
                  const response = await fetch(processedRequest.url, {
                      method: processedRequest.method,
                      headers: processedRequest.headers,
                      body: processedRequest.body ? JSON.stringify(processedRequest.body) : undefined
                  });
                  
                  // Получаем данные ответа
                  const data = await response.json();
                  
                  // Формируем объект ответа
                  const responseObj = {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers.entries()),
                      body: data
                  };
                  
                  return this.processResponse(responseObj);
              } catch (error) {
                  // В случае ошибки возвращаем специальный ответ
                  return {
                      status: 500,
                      statusText: 'Error',
                      headers: {'Content-Type': 'application/json'},
                      body: {
                          error: 'Ошибка при обращении к учебному API',
                          message: error.message,
                          source: 'custom'
                      }
                  };
              }
          }
      }
  };
  
  // Проверка доступности API
  async function checkApiAvailability() {
    // Логируем начало проверки
    if (window.HttpLogger) {
        console.log('Начало проверки доступности API источников');
    }
    
    try {
        // Проверка публичного API
        try {
            const publicResponse = await fetch(`${apiBaseUrls.public}/health`, {
                method: 'GET',
                headers: {'X-API-Quest-Client': 'Health-Check'},
                timeout: 5000 // Таймаут 5 секунд
            });
            apiSources.public.isAvailable = publicResponse.ok;
            
            if (window.HttpLogger) {
                console.log(`Публичный API ${publicResponse.ok ? 'доступен' : 'недоступен'}`);
            }
        } catch (error) {
            apiSources.public.isAvailable = false;
            console.log('Публичный API недоступен:', error.message);
        }
        
        try {
            // Проверка собственного API
            const customResponse = await fetch(`${apiBaseUrls.custom}/health`, {
                method: 'GET',
                headers: {'X-API-Quest-Client': 'Health-Check'},
                timeout: 5000 // Таймаут 5 секунд
            });
            apiSources.custom.isAvailable = customResponse.ok;
            
            if (window.HttpLogger) {
                console.log(`Учебный API ${customResponse.ok ? 'доступен' : 'недоступен'}`);
            }
        } catch (error) {
            apiSources.custom.isAvailable = false;
            console.log('Собственный API недоступен:', error.message);
        }
        
        // Обновляем селектор источников
        updateSourceSelector();
        
        // Выбираем оптимальный источник, если текущий недоступен
        autoSelectSource();
    } catch (error) {
        console.error('Ошибка при проверке доступности API:', error);
    }
  }
  
  // Автоматический выбор оптимального источника
  function autoSelectSource() {
      // Если текущий источник доступен, оставляем его
      if (apiSources[currentSource].isAvailable) {
          return;
      }
      
      // Сортируем источники по приоритету и доступности
      const availableSources = Object.keys(apiSources)
          .filter(source => apiSources[source].isAvailable)
          .sort((a, b) => apiSources[a].priority - apiSources[b].priority);
      
      if (availableSources.length > 0) {
          // Выбираем источник с наивысшим приоритетом
          setApiSource(availableSources[0]);
      } else {
          // Если нет доступных источников, используем моки
          setApiSource('mock');
      }
  }
  
  // Обновление селектора источников в UI
  function updateSourceSelector() {
      const selector = document.getElementById('api-source-selector');
      if (!selector) return;
      
      // Очищаем текущие опции
      selector.innerHTML = '';
      
      // Добавляем опции для каждого источника
      Object.keys(apiSources).forEach(sourceKey => {
          const source = apiSources[sourceKey];
          const option = document.createElement('option');
          option.value = sourceKey;
          option.textContent = source.name;
          option.disabled = !source.isAvailable;
          
          if (sourceKey === currentSource) {
              option.selected = true;
          }
          
          selector.appendChild(option);
      });
  }

  // Получение статистики по запросам
  function getRequestsStats() {
    if (!window.HttpLogger) {
        return { total: 0, bySource: {} };
    }
    
    const logs = HttpLogger.getLogs();
    
    // Фильтруем только запросы
    const requestLogs = logs.filter(log => log.type === HttpLogger.LOG_TYPES.REQUEST);
    
    // Группируем по источникам
    const statsBySource = {};
    
    requestLogs.forEach(log => {
        const source = log.source || 'unknown';
        
        if (!statsBySource[source]) {
            statsBySource[source] = {
                total: 0,
                byMethod: {}
            };
        }
        
        statsBySource[source].total++;
        
        const method = log.data.method;
        if (!statsBySource[source].byMethod[method]) {
            statsBySource[source].byMethod[method] = 0;
        }
        
        statsBySource[source].byMethod[method]++;
    });
    
    return {
        total: requestLogs.length,
        bySource: statsBySource
    };
  }
  
  // Установка текущего источника API
  function setApiSource(sourceKey) {
    if (!apiSources[sourceKey]) {
        console.error('Неизвестный источник API:', sourceKey);
        return false;
    }
    
    // Запоминаем предыдущий источник для логирования
    const previousSource = currentSource;
    
    if (!apiSources[sourceKey].isAvailable && sourceKey !== 'mock') {
        console.warn(`Источник API "${apiSources[sourceKey].name}" недоступен. Используется резервный источник.`);
        autoSelectSource();
        return false;
    }
    
    currentSource = sourceKey;
    
    // Обновляем локальное хранилище
    localStorage.setItem('apiQuestSelectedSource', sourceKey);
    
    // Обновляем селектор в интерфейсе
    updateSourceSelector();
    
    // Уведомляем об изменении источника
    UI.showNotification(`Источник API изменен на "${apiSources[sourceKey].name}"`, 'info');
    
    // Логируем изменение источника
    if (window.HttpLogger && previousSource !== sourceKey) {
        console.log(`API источник изменен: ${previousSource} -> ${sourceKey}`);
    }
    
    return true;
  }
  
  // Инициализация модуля
  async function init() {
      // Загружаем сохраненный выбор источника
      const savedSource = localStorage.getItem('apiQuestSelectedSource');
      if (savedSource && apiSources[savedSource]) {
          currentSource = savedSource;
      }
      
      // Проверяем доступность API-источников
      await checkApiAvailability();
      
      // Создаем селектор источников, если его еще нет
      createSourceSelector();
      
      // Устанавливаем интервал проверки доступности API
      setInterval(checkApiAvailability, 60000); // Каждую минуту
  }
  
  // Создание селектора источников API
  function createSourceSelector() {
      // Проверяем, существует ли уже селектор
      if (document.getElementById('api-source-selector')) {
          return;
      }
      
      // Создаем контейнер для селектора
      const selectorContainer = document.createElement('div');
      selectorContainer.className = 'api-source-selector-container';
      
      // Создаем лейбл
      const label = document.createElement('label');
      label.htmlFor = 'api-source-selector';
      label.textContent = 'Источник API:';
      
      // Создаем селектор
      const selector = document.createElement('select');
      selector.id = 'api-source-selector';
      selector.className = 'form-control';
      
      // Добавляем обработчик изменения
      selector.addEventListener('change', function() {
          setApiSource(this.value);
      });
      
      // Добавляем селектор в контейнер
      selectorContainer.appendChild(label);
      selectorContainer.appendChild(selector);
      
      // Добавляем селектор на страницу
      const actionsContainer = document.querySelector('.content-header .actions');
      if (actionsContainer) {
          actionsContainer.appendChild(selectorContainer);
      }
      
      // Заполняем селектор и выбираем текущий источник
      updateSourceSelector();
  }
  
  // Отправка запроса через текущий адаптер
  async function sendRequest(request) {
    const adapter = apiAdapters[currentSource];
    
    // Показываем индикатор загрузки
    UI.toggleLoadingIndicator('response-meta', true);
    document.getElementById('response-body').textContent = 'Загрузка...';
    
    // Логируем запрос, если доступен HttpLogger
    let requestLog;
    if (window.HttpLogger) {
        requestLog = HttpLogger.logRequest(request, currentSource);
    }
    
    try {
        // Отправляем запрос через выбранный адаптер
        const response = await adapter.sendRequest(request);
        
        // Логируем успешный ответ, если доступен HttpLogger
        if (window.HttpLogger && requestLog) {
            HttpLogger.logResponse(response, requestLog.id, currentSource);
        }
        
        // Сохраняем решение
        ProgressManager.saveCurrentSolution();
        
        // Обновляем прогресс задания
        const task = AppMain.getCurrentTask();
        if (task) {
            ProgressManager.updateTaskAttempt(task.id);
        }
        
        return response;
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        
        // Логируем ошибку, если доступен HttpLogger
        if (window.HttpLogger && requestLog) {
            HttpLogger.logError(error, requestLog.id, currentSource);
        }
        
        // В случае ошибки возвращаем специальный ответ
        return {
            status: 500,
            statusText: 'Error',
            headers: {'Content-Type': 'application/json'},
            body: {
                error: 'Ошибка при отправке запроса',
                message: error.message,
                source: currentSource
            }
        };
    } finally {
        // Скрываем индикатор загрузки
        UI.toggleLoadingIndicator('response-meta', false);
    }
  }
  
  // Получение информации о текущем источнике
  function getCurrentSourceInfo() {
      return {
          key: currentSource,
          ...apiSources[currentSource]
      };
  }
  
  // Получение списка всех доступных источников
  function getAvailableSources() {
      return Object.keys(apiSources)
          .filter(key => apiSources[key].isAvailable)
          .map(key => ({
              key,
              name: apiSources[key].name,
              description: apiSources[key].description,
              priority: apiSources[key].priority
          }));
  }
  
  // Публичное API модуля
  return {
      init,
      sendRequest,
      setApiSource,
      getCurrentSourceInfo,
      getAvailableSources,
      checkApiAvailability,
      createSourceSelector,
      updateSourceSelector,
      getRequestsStats
  };
})();

// Экспортируем модуль в глобальную область видимости
window.ApiSourceManager = ApiSourceManager;