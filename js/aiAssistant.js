// aiAssistant.js - Модуль AI-ассистента для API-Quest

const AiAssistant = (function() {
  // Приватные переменные и функции
  
  // Массив предустановленных сообщений для различных ситуаций
  const aiResponses = {
      welcome: "Здравствуйте! Я ваш AI-ассистент. Готов помочь с выполнением задания. Вы можете попросить помощь или анализ вашего решения в любой момент.",
      
      methodHelp: {
          GET: "Метод GET используется для получения данных с сервера. Он не должен содержать тело запроса и не изменяет состояние сервера.",
          POST: "Метод POST используется для отправки данных на сервер для создания нового ресурса. Обычно содержит тело запроса с данными.",
          PUT: "Метод PUT используется для полного обновления существующего ресурса. Содержит тело запроса с полными данными обновляемого ресурса.",
          PATCH: "Метод PATCH используется для частичного обновления существующего ресурса. Содержит тело запроса только с изменяемыми полями.",
          DELETE: "Метод DELETE используется для удаления ресурса на сервере. Обычно не содержит тело запроса."
      },
      
      headerHelp: {
          "Content-Type": "Заголовок Content-Type указывает формат тела запроса. Для JSON используйте 'application/json'.",
          "Authorization": "Заголовок Authorization используется для передачи учетных данных для аутентификации на сервере.",
          "X-API-Key": "Заголовок X-API-Key используется для передачи API-ключа для доступа к защищенным ресурсам."
      },
      
      statusCodes: {
          200: "200 OK: Успешный запрос. Сервер вернул запрошенные данные.",
          201: "201 Created: Ресурс успешно создан. Используется после успешного POST-запроса.",
          204: "204 No Content: Запрос выполнен успешно, но сервер не вернул данные.",
          400: "400 Bad Request: Сервер не может обработать запрос из-за ошибки клиента (например, неверный формат данных).",
          401: "401 Unauthorized: Требуется аутентификация. Клиент не предоставил необходимые учетные данные.",
          403: "403 Forbidden: Сервер понял запрос, но отказывается его выполнять из-за отсутствия прав доступа.",
          404: "404 Not Found: Запрашиваемый ресурс не найден на сервере.",
          500: "500 Internal Server Error: Внутренняя ошибка сервера. Сервер столкнулся с неожиданной ошибкой."
      },
      
      analysisSuccess: "Ваш запрос выглядит правильно! Все необходимые элементы присутствуют.",
      analysisFailed: "В вашем запросе есть проблемы, которые нужно исправить:",
      
      hints: {
          general: "Внимательно прочитайте требования задания. Проверьте метод, URL и заголовки.",
          json: "Убедитесь, что ваше JSON-тело запроса правильно форматировано и содержит все необходимые поля.",
          headers: "Не забудьте добавить все необходимые заголовки. Для запросов с телом обычно требуется заголовок Content-Type.",
          auth: "Для доступа к защищенным ресурсам необходима аутентификация. Проверьте, правильно ли вы передаете API-ключ или токен."
      }
  };
  
  // Добавление сообщения от AI-ассистента в чат
  function addAiMessage(message) {
      const aiContent = document.getElementById('ai-feedback-content');
      
      const messageElement = document.createElement('div');
      messageElement.className = 'ai-message';
      messageElement.innerHTML = `<p>${message}</p>`;
      
      aiContent.appendChild(messageElement);
      
      // Прокрутка к последнему сообщению
      aiContent.scrollTop = aiContent.scrollHeight;
  }
  
  // Добавление сообщения пользователя в чат
  function addUserMessage(message) {
      const aiContent = document.getElementById('ai-feedback-content');
      
      const messageElement = document.createElement('div');
      messageElement.className = 'user-message';
      messageElement.innerHTML = `<p>${message}</p>`;
      
      aiContent.appendChild(messageElement);
      
      // Прокрутка к последнему сообщению
      aiContent.scrollTop = aiContent.scrollHeight;
  }
  
  // Инициализация AI-ассистента
  function initAiAssistant() {
      // Добавляем приветственное сообщение
      addAiMessage(aiResponses.welcome);
  }
  
  // Помощь по текущему заданию
  function askHelp() {
      const task = AppMain.getCurrentTask();
      if (!task) return;
      
      // Добавляем сообщение пользователя
      addUserMessage("Помогите мне с этим заданием, пожалуйста.");
      
      // Генерируем ответ на основе данных задания
      let helpMessage = `<p>Конечно! Вот что нужно сделать в задании "${task.title}":</p>`;
      
      // Добавляем основную информацию о задании
      helpMessage += `<p>${task.description}</p>`;
      
      // Советы по методу запроса
      if (task.solution && task.solution.method) {
          helpMessage += `<p><strong>Метод запроса:</strong> ${task.solution.method}</p>`;
          helpMessage += `<p>${aiResponses.methodHelp[task.solution.method]}</p>`;
      }
      
      // Советы по URL
      if (task.solution && task.solution.url) {
          helpMessage += `<p><strong>URL:</strong> ${task.solution.url}</p>`;
      }
      
      // Советы по заголовкам
      if (task.solution && task.solution.headers) {
          helpMessage += `<p><strong>Заголовки:</strong></p><ul>`;
          
          for (const headerName in task.solution.headers) {
              helpMessage += `<li>${headerName}`;
              if (aiResponses.headerHelp[headerName]) {
                  helpMessage += `: ${aiResponses.headerHelp[headerName]}`;
              }
              helpMessage += `</li>`;
          }
          
          helpMessage += `</ul>`;
      }
      
      // Советы по телу запроса
      if (task.solution && task.solution.body && typeof task.solution.body === 'object') {
          helpMessage += `<p><strong>Тело запроса:</strong> Должно содержать следующие поля:</p><ul>`;
          
          for (const fieldName in task.solution.body) {
              helpMessage += `<li>${fieldName}</li>`;
          }
          
          helpMessage += `</ul>`;
      }
      
      // Общие советы
      helpMessage += `<p><strong>Совет:</strong> ${aiResponses.hints.general}</p>`;
      
      // Добавляем ответ ассистента
      addAiMessage(helpMessage);
  }
  
  // Анализ текущего запроса
  function analyzeRequest() {
      const task = AppMain.getCurrentTask();
      if (!task) return;
      
      // Добавляем сообщение пользователя
      addUserMessage("Проанализируйте мой запрос, пожалуйста.");
      
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
      let requestBody = null;
      let bodyValid = true;
      
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
              const bodyText = document.getElementById('request-body').value.trim();
              if (bodyText) {
                  requestBody = JSON.parse(bodyText);
              }
          } catch (e) {
              bodyValid = false;
          }
      }
      
      // Анализируем запрос на соответствие заданию
      const issues = [];
      
      // Проверка метода
      if (task.solution && task.solution.method && method !== task.solution.method) {
          issues.push(`Используется метод ${method}, но для этого задания требуется ${task.solution.method}.`);
      }
      
      // Проверка URL
      if (task.solution && task.solution.url && url !== task.solution.url) {
          issues.push(`URL не соответствует заданию. Ожидается: ${task.solution.url}`);
      }
      
      // Проверка заголовков
      if (task.solution && task.solution.headers) {
          for (const [key, value] of Object.entries(task.solution.headers)) {
              if (!headers[key]) {
                  issues.push(`Отсутствует заголовок ${key}.`);
              } else if (value !== true && value !== '' && headers[key] !== value) {
                  issues.push(`Неверное значение заголовка ${key}.`);
              }
          }
      }
      
      // Проверка тела запроса
      if (!bodyValid && ['POST', 'PUT', 'PATCH'].includes(method)) {
          issues.push('Тело запроса содержит некорректный JSON.');
      } else if (task.solution && task.solution.body && typeof task.solution.body === 'object' && 
              ['POST', 'PUT', 'PATCH'].includes(method)) {
          for (const [key, value] of Object.entries(task.solution.body)) {
              if (!requestBody || requestBody[key] === undefined) {
                  issues.push(`В теле запроса отсутствует обязательное поле ${key}.`);
              } else if (value !== true && requestBody[key] !== value) {
                  issues.push(`Неверное значение поля ${key} в теле запроса.`);
              }
          }
      }
      
      // Формируем ответ на основе анализа
      let analysisMessage = '';
      
      if (issues.length === 0) {
          analysisMessage = `<p>${aiResponses.analysisSuccess}</p>`;
          
          // Добавляем рекомендации по дальнейшим действиям
          analysisMessage += '<p>Вы можете отправить запрос и проверить ответ сервера. Если ответ соответствует ожидаемому, нажмите кнопку "Проверить решение".</p>';
      } else {
          analysisMessage = `<p>${aiResponses.analysisFailed}</p><ul>`;
          
          for (const issue of issues) {
              analysisMessage += `<li>${issue}</li>`;
          }
          
          analysisMessage += '</ul>';
          
          // Добавляем рекомендации по исправлению
          analysisMessage += '<p>Исправьте указанные проблемы и попробуйте снова.</p>';
      }
      
      // Добавляем ответ ассистента
      addAiMessage(analysisMessage);
  }
  
  // Обработка пользовательского вопроса
  function sendQuestion() {
      const inputField = document.getElementById('ai-question-input');
      const question = inputField.value.trim();
      
      if (!question) return;
      
      // Добавляем вопрос пользователя в чат
      addUserMessage(question);
      
      // Очищаем поле ввода
      inputField.value = '';
      
      // Генерируем ответ на основе ключевых слов в вопросе
      let answer = '';
      
      // Проверяем наличие ключевых слов в вопросе
      const lowerQuestion = question.toLowerCase();
      
      if (lowerQuestion.includes('метод') || 
          lowerQuestion.includes('get') || 
          lowerQuestion.includes('post') || 
          lowerQuestion.includes('put') || 
          lowerQuestion.includes('delete') ||
          lowerQuestion.includes('patch')) {
          
          answer = '<p>Основные HTTP методы:</p><ul>';
          for (const [method, description] of Object.entries(aiResponses.methodHelp)) {
              answer += `<li><strong>${method}</strong>: ${description}</li>`;
          }
          answer += '</ul>';
      } 
      else if (lowerQuestion.includes('заголов') || lowerQuestion.includes('header')) {
          answer = '<p>Важные HTTP заголовки:</p><ul>';
          for (const [header, description] of Object.entries(aiResponses.headerHelp)) {
              answer += `<li><strong>${header}</strong>: ${description}</li>`;
          }
          answer += '</ul>';
      }
      else if (lowerQuestion.includes('статус') || lowerQuestion.includes('код') || lowerQuestion.includes('status') || lowerQuestion.includes('code')) {
          answer = '<p>Основные HTTP статус-коды:</p><ul>';
          for (const [code, description] of Object.entries(aiResponses.statusCodes)) {
              answer += `<li><strong>${code}</strong>: ${description}</li>`;
          }
          answer += '</ul>';
      }
      else if (lowerQuestion.includes('json') || lowerQuestion.includes('тело') || lowerQuestion.includes('body')) {
          answer = `<p>${aiResponses.hints.json}</p>
                   <p>Пример JSON-тела запроса:</p>
                   <pre>{\n  "name": "Иван Иванов",\n  "email": "ivan@example.com",\n  "role": "user"\n}</pre>`;
      }
      else if (lowerQuestion.includes('аутентификац') || lowerQuestion.includes('авториз') || lowerQuestion.includes('auth')) {
          answer = `<p>${aiResponses.hints.auth}</p>
                   <p>Примеры аутентификации:</p>
                   <ol>
                     <li>API-ключ: <code>X-API-Key: your_api_key_123</code></li>
                     <li>Bearer-токен: <code>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code></li>
                     <li>Basic-аутентификация: <code>Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=</code></li>
                   </ol>`;
      }
      else {
          // Общий ответ, если не нашли конкретную тему
          const task = AppMain.getCurrentTask();
          
          if (task) {
              answer = `<p>Для выполнения задания "${task.title}" вам необходимо:</p>
                       <ol>
                         <li>Использовать правильный HTTP-метод</li>
                         <li>Указать корректный URL</li>
                         <li>Добавить необходимые заголовки</li>
                         <li>Сформировать правильное тело запроса (для POST/PUT/PATCH)</li>
                       </ol>
                       <p>Проверьте требования задания и попробуйте отправить запрос. Если будут ошибки, вы можете попросить меня проанализировать ваш запрос.</p>`;
          } else {
              answer = "Извините, я не могу ответить на этот вопрос. Попробуйте задать более конкретный вопрос, связанный с API или текущим заданием.";
          }
      }
      
      // Добавляем ответ в чат
      setTimeout(() => {
          addAiMessage(answer);
      }, 500);
  }
  
  // Публичное API модуля
  return {
      initAiAssistant,
      askHelp,
      analyzeRequest,
      sendQuestion,
      addAiMessage,
      addUserMessage
  };
})();

// Экспортируем модуль в глобальную область видимости
window.AiAssistant = AiAssistant;

// Инициализация AI-ассистента при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  AiAssistant.initAiAssistant();
});