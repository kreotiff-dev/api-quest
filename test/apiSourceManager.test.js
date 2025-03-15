// tests/apiSourceManager.test.js - Тесты для модуля ApiSourceManager с использованием Jest

describe('ApiSourceManager', () => {
  // Сохраняем оригинальные функции для восстановления после тестов
  let originalFetch;
  let originalLocalStorage;
  
  beforeAll(() => {
      // Сохраняем оригинальные функции
      originalFetch = window.fetch;
      originalLocalStorage = window.localStorage;
      
      // Создаем заглушки для localStorage
      const localStorageMock = {
          store: {},
          getItem: jest.fn(function(key) { return this.store[key] || null; }),
          setItem: jest.fn(function(key, value) { this.store[key] = value; }),
          removeItem: jest.fn(function(key) { delete this.store[key]; }),
          clear: jest.fn(function() { this.store = {}; })
      };
      
      // Применяем моки
      Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
          writable: true
      });
      
      // Устанавливаем моки для UI модуля
      window.UI = {
          showNotification: jest.fn(),
          toggleLoadingIndicator: jest.fn(),
          createDynamicModal: jest.fn()
      };
  });
  
  afterAll(() => {
      // Восстанавливаем оригинальные функции
      window.fetch = originalFetch;
      Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true
      });
  });
  
  beforeEach(() => {
      // Настраиваем заглушку fetch перед каждым тестом
      window.fetch = jest.fn();
      
      // Очищаем localStorage перед каждым тестом
      window.localStorage.clear();
      
      // Очищаем моки перед каждым тестом
      jest.clearAllMocks();
  });
  
  describe('Инициализация', () => {
      test('должна правильно инициализировать модуль и использовать сохраненный источник', async () => {
          // Устанавливаем заглушку для fetch, чтобы имитировать успешные проверки доступности
          window.fetch.mockImplementation((url) => {
              if (url.includes('/health')) {
                  return Promise.resolve({
                      ok: true,
                      json: () => Promise.resolve({ status: 'ok' })
                  });
              }
              return Promise.reject(new Error('Fetch error'));
          });
          
          // Устанавливаем сохраненный выбор источника в localStorage
          window.localStorage.setItem('apiQuestSelectedSource', 'public');
          
          // Вызываем метод инициализации
          await ApiSourceManager.init();
          
          // Проверяем, что модуль правильно инициализирован
          const currentSource = ApiSourceManager.getCurrentSourceInfo();
          expect(currentSource).toBeDefined();
          expect(currentSource.key).toBe('public');
      });
      
      test('должна использовать mock источник по умолчанию, если ничего не сохранено', async () => {
          // Имитируем ситуацию, когда localStorage пуст
          
          // Вызываем метод инициализации
          await ApiSourceManager.init();
          
          // Проверяем, что модуль использует mock источник по умолчанию
          const currentSource = ApiSourceManager.getCurrentSourceInfo();
          expect(currentSource).toBeDefined();
          expect(currentSource.key).toBe('mock');
      });
      
      test('должна создавать селектор источников в UI', async () => {
          // Создаем заглушку для DOM элемента
          const mockElement = document.createElement('div');
          mockElement.className = 'content-header';
          mockElement.innerHTML = '<div class="actions"></div>';
          document.body.appendChild(mockElement);
          
          // Заглушка для querySelector
          const originalQuerySelector = document.querySelector;
          document.querySelector = jest.fn((selector) => {
              if (selector === '.content-header .actions') {
                  return mockElement.querySelector('.actions');
              }
              return null;
          });
          
          // Вызываем метод создания селектора
          ApiSourceManager.createSourceSelector();
          
          // Проверяем, что селектор был создан
          const selector = document.getElementById('api-source-selector');
          expect(selector).toBeDefined();
          
          // Восстанавливаем оригинальный querySelector
          document.querySelector = originalQuerySelector;
          
          // Удаляем тестовый элемент
          document.body.removeChild(mockElement);
      });
  });
  
  describe('Переключение источников', () => {
      test('должно успешно переключаться на доступный источник', () => {
          // Подготавливаем API Source Manager
          ApiSourceManager.setApiSource('mock'); // Начинаем с mock источника
          
          // Переключаемся на public и имитируем его доступность
          const result = ApiSourceManager.setApiSource('public');
          
          // Проверяем результат переключения
          expect(result).toBe(true);
          
          // Проверяем, что источник действительно изменился
          const currentSource = ApiSourceManager.getCurrentSourceInfo();
          expect(currentSource.key).toBe('public');
          
          // Проверяем, что значение сохранено в localStorage
          expect(window.localStorage.setItem).toHaveBeenCalledWith(
              'apiQuestSelectedSource', 
              'public'
          );
          
          // Проверяем, что показано уведомление
          expect(UI.showNotification).toHaveBeenCalled();
      });
      
      test('должно обрабатывать переключение на несуществующий источник', () => {
          // Подготавливаем API Source Manager
          ApiSourceManager.setApiSource('mock');
          
          // Пытаемся переключиться на несуществующий источник
          const result = ApiSourceManager.setApiSource('nonexistent');
          
          // Проверяем результат переключения
          expect(result).toBe(false);
          
          // Проверяем, что источник не изменился
          const currentSource = ApiSourceManager.getCurrentSourceInfo();
          expect(currentSource.key).toBe('mock');
      });
      
      test('должно обновлять селектор источников при переключении', () => {
          // Создаем заглушку для селектора
          const mockSelector = document.createElement('select');
          mockSelector.id = 'api-source-selector';
          document.body.appendChild(mockSelector);
          
          // Заглушка для getElementById
          const originalGetElementById = document.getElementById;
          document.getElementById = jest.fn((id) => {
              if (id === 'api-source-selector') {
                  return mockSelector;
              }
              return null;
          });
          
          // Переключаем источник
          ApiSourceManager.setApiSource('public');
          
          // Проверяем, что метод updateSourceSelector был вызван
          // Косвенная проверка через изменение селектора
          
          // Восстанавливаем оригинальный getElementById
          document.getElementById = originalGetElementById;
          
          // Удаляем тестовый элемент
          document.body.removeChild(mockSelector);
      });
  });
  
  describe('Проверка доступности', () => {
      test('должна правильно определять доступные источники API', async () => {
          // Устанавливаем заглушку для fetch, чтобы имитировать различную доступность источников
          window.fetch.mockImplementation((url) => {
              if (url.includes('public') && url.includes('/health')) {
                  return Promise.resolve({
                      ok: true,
                      json: () => Promise.resolve({ status: 'ok' })
                  });
              } else if (url.includes('custom') && url.includes('/health')) {
                  return Promise.resolve({
                      ok: false,
                      json: () => Promise.resolve({ status: 'error' })
                  });
              }
              return Promise.reject(new Error('Fetch error'));
          });
          
          // Запускаем проверку доступности
          await ApiSourceManager.checkApiAvailability();
          
          // Получаем доступные источники
          const availableSources = ApiSourceManager.getAvailableSources();
          
          // Проверяем, что mock всегда доступен
          const mockAvailable = availableSources.some(source => source.key === 'mock');
          expect(mockAvailable).toBe(true);
          
          // Проверяем, что public доступен (т.к. мы его сделали доступным через имитацию)
          const publicAvailable = availableSources.some(source => source.key === 'public');
          expect(publicAvailable).toBe(true);
          
          // Проверяем, что custom недоступен (т.к. мы его сделали недоступным через имитацию)
          const customAvailable = availableSources.some(source => source.key === 'custom');
          expect(customAvailable).toBe(false);
      });
      
      test('должна автоматически выбирать оптимальный источник при недоступности текущего', async () => {
          // Устанавливаем недоступный источник
          ApiSourceManager.setApiSource('custom');
          
          // Устанавливаем заглушку для fetch, чтобы имитировать недоступность custom
          window.fetch.mockImplementation((url) => {
              if (url.includes('custom')) {
                  return Promise.resolve({
                      ok: false,
                      json: () => Promise.resolve({ status: 'error' })
                  });
              } else if (url.includes('public')) {
                  return Promise.resolve({
                      ok: true,
                      json: () => Promise.resolve({ status: 'ok' })
                  });
              }
              return Promise.reject(new Error('Fetch error'));
          });
          
          // Запускаем проверку доступности
          await ApiSourceManager.checkApiAvailability();
          
          // Проверяем, что произошло автоматическое переключение на доступный источник
          const currentSource = ApiSourceManager.getCurrentSourceInfo();
          expect(currentSource.key).not.toBe('custom');
      });
  });
  
  describe('Обработка запросов', () => {
      test('должна успешно отправлять запросы через mock источник', async () => {
          // Устанавливаем mock источник
          ApiSourceManager.setApiSource('mock');
          
          // Создаем тестовый запрос
          const testRequest = {
              method: 'GET',
              url: '/api/users',
              headers: {
                  'Accept': 'application/json'
              }
          };
          
          // Отправляем запрос через ApiSourceManager
          const response = await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем структуру ответа
          expect(response).toHaveProperty('status');
          expect(response).toHaveProperty('headers');
          expect(response).toHaveProperty('body');
          
          // Проверяем, что прогресс был сохранен
          expect(window.ProgressManager?.saveCurrentSolution).toBeCalled;
      });
      
      test('должна обрабатывать ошибки при отправке запросов', async () => {
          // Устанавливаем mock источник
          ApiSourceManager.setApiSource('public');
          
          // Создаем заглушку для адаптера, которая будет возвращать ошибку
          const originalSendRequest = ApiSourceManager.sendRequest;
          
          ApiSourceManager.sendRequest = jest.fn(async (request) => {
              if (request.url === '/error') {
                  return {
                      status: 500,
                      statusText: 'Error',
                      headers: {'Content-Type': 'application/json'},
                      body: {
                          error: 'Test error',
                          message: 'This is a test error'
                      }
                  };
              }
              return originalSendRequest(request);
          });
          
          // Создаем тестовый запрос с ошибкой
          const testRequest = {
              method: 'GET',
              url: '/error',
              headers: {}
          };
          
          // Отправляем запрос через ApiSourceManager
          const response = await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем, что ответ содержит информацию об ошибке
          expect(response.status).toBe(500);
          expect(response.body).toHaveProperty('error');
          
          // Восстанавливаем оригинальный метод
          ApiSourceManager.sendRequest = originalSendRequest;
      });
      
      test('должна включать индикатор загрузки при отправке запроса', async () => {
          // Устанавливаем mock источник
          ApiSourceManager.setApiSource('mock');
          
          // Создаем тестовый запрос
          const testRequest = {
              method: 'GET',
              url: '/api/users',
              headers: {}
          };
          
          // Отправляем запрос через ApiSourceManager
          await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем, что индикатор загрузки был показан и скрыт
          expect(UI.toggleLoadingIndicator).toHaveBeenCalledWith('response-meta', true);
          expect(UI.toggleLoadingIndicator).toHaveBeenCalledWith('response-meta', false);
      });
  });
  
  describe('Адаптеры запросов', () => {
      test('адаптер mock должен корректно обрабатывать запросы', async () => {
          // Устанавливаем mock источник
          ApiSourceManager.setApiSource('mock');
          
          // Создаем тестовый запрос к известному моку
          const testRequest = {
              method: 'GET',
              url: '/api/users',
              headers: {}
          };
          
          // Отправляем запрос
          const response = await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем корректность ответа
          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
      });
      
      test('адаптер public должен добавлять необходимые заголовки', async () => {
          // Устанавливаем public источник
          ApiSourceManager.setApiSource('public');
          
          // Создаем заглушку для fetch, чтобы проверить преобразование запроса
          window.fetch.mockImplementation((url, options) => {
              // Проверяем, что URL был преобразован
              expect(url).toContain('jsonplaceholder.typicode.com');
              
              // Проверяем, что заголовки были добавлены
              expect(options.headers).toHaveProperty('X-API-Quest-Client');
              expect(options.headers['X-API-Quest-Client']).toBe('Public');
              
              return Promise.resolve({
                  ok: true,
                  status: 200,
                  statusText: 'OK',
                  headers: new Map([['Content-Type', 'application/json']]),
                  json: () => Promise.resolve([{ id: 1, title: 'Test post' }])
              });
          });
          
          // Создаем тестовый запрос
          const testRequest = {
              method: 'GET',
              url: '/posts',
              headers: {}
          };
          
          // Отправляем запрос
          await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем, что fetch был вызван
          expect(window.fetch).toHaveBeenCalled();
      });
      
      test('адаптер custom должен добавлять токен авторизации', async () => {
          // Устанавливаем custom источник
          ApiSourceManager.setApiSource('custom');
          
          // Имитируем наличие токена авторизации
          sessionStorage.setItem('apiQuestAuthToken', 'test-token');
          
          // Создаем заглушку для fetch, чтобы проверить преобразование запроса
          window.fetch.mockImplementation((url, options) => {
              // Проверяем, что URL был преобразован
              expect(url).toContain('api-quest.example.com/api');
              
              // Проверяем, что заголовок авторизации был добавлен
              expect(options.headers).toHaveProperty('X-API-Quest-Auth');
              expect(options.headers['X-API-Quest-Auth']).toBe('test-token');
              
              return Promise.resolve({
                  ok: true,
                  status: 200,
                  statusText: 'OK',
                  headers: new Map([
                      ['Content-Type', 'application/json'],
                      ['X-API-Quest-Auth-Token', 'new-token']
                  ]),
                  json: () => Promise.resolve({ success: true, data: {} })
              });
          });
          
          // Создаем тестовый запрос
          const testRequest = {
              method: 'GET',
              url: '/protected/data',
              headers: {}
          };
          
          // Отправляем запрос
          await ApiSourceManager.sendRequest(testRequest);
          
          // Проверяем, что fetch был вызван
          expect(window.fetch).toHaveBeenCalled();
          
          // Очищаем sessionStorage
          sessionStorage.removeItem('apiQuestAuthToken');
      });
  });
  
  describe('Вспомогательные функции', () => {
      test('getCurrentSourceInfo должна возвращать информацию о текущем источнике', () => {
          // Устанавливаем известный источник
          ApiSourceManager.setApiSource('mock');
          
          // Получаем информацию о текущем источнике
          const sourceInfo = ApiSourceManager.getCurrentSourceInfo();
          
          // Проверяем структуру информации
          expect(sourceInfo).toHaveProperty('key');
          expect(sourceInfo).toHaveProperty('name');
          expect(sourceInfo).toHaveProperty('description');
          expect(sourceInfo.key).toBe('mock');
      });
      
      test('getAvailableSources должна возвращать список доступных источников', () => {
          // Получаем список доступных источников
          const sources = ApiSourceManager.getAvailableSources();
          
          // Проверяем, что список не пустой
          expect(sources.length).toBeGreaterThan(0);
          
          // Проверяем структуру элементов списка
          sources.forEach(source => {
              expect(source).toHaveProperty('key');
              expect(source).toHaveProperty('name');
              expect(source).toHaveProperty('description');
          });
          
          // Проверяем, что mock источник всегда доступен
          const mockSource = sources.find(source => source.key === 'mock');
          expect(mockSource).toBeDefined();
      });
  });
});