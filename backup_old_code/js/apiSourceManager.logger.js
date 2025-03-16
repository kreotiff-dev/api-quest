// apiSourceManager.logger.js - Расширение модуля ApiSourceManager для интеграции с HttpLogger

// Самовызывающаяся функция для расширения ApiSourceManager
(function() {
  // Проверяем, что оба модуля существуют
  if (!window.ApiSourceManager || !window.HttpLogger) {
      console.error('Ошибка: ApiSourceManager или HttpLogger не найдены');
      return;
  }
  
  // Сохраняем оригинальные методы для перехвата
  const originalSendRequest = ApiSourceManager.sendRequest;
  
  // Перехватываем метод sendRequest для логирования запросов и ответов
  ApiSourceManager.sendRequest = async function(request) {
      // Получаем текущий источник API
      const currentSource = ApiSourceManager.getCurrentSourceInfo();
      
      // Логируем запрос
      const requestLog = HttpLogger.logRequest(request, currentSource.key);
      
      try {
          // Отправляем запрос через оригинальный метод
          const response = await originalSendRequest.call(this, request);
          
          // Логируем успешный ответ
          HttpLogger.logResponse(response, requestLog.id, currentSource.key);
          
          return response;
      } catch (error) {
          // Логируем ошибку, если она произошла
          HttpLogger.logError(error, requestLog.id, currentSource.key);
          
          // Пробрасываем ошибку дальше
          throw error;
      }
  };
  
  // Также перехватываем методы адаптеров для подробного логирования
  // Для имитации приватных методов используем более сложный подход
  
  // Mock адаптер
  if (ApiSourceManager._adapters && ApiSourceManager._adapters.mock) {
      const originalMockSendRequest = ApiSourceManager._adapters.mock.sendRequest;
      
      ApiSourceManager._adapters.mock.sendRequest = async function(request) {
          // Логируем детали обработки запроса в mock адаптере
          console.log('Mock адаптер обрабатывает запрос:', request);
          
          return originalMockSendRequest.call(this, request);
      };
  }
  
  // Перехватываем метод checkApiAvailability для логирования проверок доступности
  const originalCheckApiAvailability = ApiSourceManager.checkApiAvailability;
  
  ApiSourceManager.checkApiAvailability = async function() {
      // Логируем начало проверки доступности
      console.log('Начало проверки доступности API источников');
      
      // Вызываем оригинальный метод
      const result = await originalCheckApiAvailability.call(this);
      
      // Логируем результаты проверки
      const availableSources = ApiSourceManager.getAvailableSources();
      console.log('Результаты проверки доступности:', availableSources);
      
      return result;
  };
  
  // Добавляем метод для получения статистики по логам запросов
  ApiSourceManager.getRequestsStats = function() {
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
  };
  
  // Перехватываем метод setApiSource для логирования переключений
  const originalSetApiSource = ApiSourceManager.setApiSource;
  
  ApiSourceManager.setApiSource = function(sourceKey) {
      // Запоминаем предыдущий источник
      const previousSource = ApiSourceManager.getCurrentSourceInfo();
      
      // Вызываем оригинальный метод
      const result = originalSetApiSource.call(this, sourceKey);
      
      // Если источник изменен успешно, логируем это
      if (result) {
          const newSource = ApiSourceManager.getCurrentSourceInfo();
          console.log(`API источник изменен: ${previousSource.key} -> ${newSource.key}`);
      }
      
      return result;
  };
  
  console.log('ApiSourceManager успешно интегрирован с HttpLogger');
})();