/**
 * Скрипт для генерации заданий по тестированию API с акцентом на проверку 
 * несоответствий между документацией и фактическими ответами API
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Task = require('./server/models/Task');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Настройка лимитов и конфигурации
const DELAY_BETWEEN_REQUESTS = 3000; // 3 секунды задержки между запросами к API
const OUTPUT_DIR = path.join(__dirname, 'verification-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Настройка логирования
const LOG_FILE = path.join(OUTPUT_DIR, 'api-tasks-generation.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Настройка OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Настройка MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => log('MongoDB подключена...'))
.catch(err => {
  log(`Ошибка подключения к MongoDB: ${err.message}`);
  process.exit(1);
});

// Базовые эндпоинты для моковой API документации
const mockApiEndpoints = [
  {
    method: 'GET',
    endpoint: '/api/users',
    description: 'Получение списка пользователей',
    parameters: [],
    expectedResponse: {
      status: 200,
      body: {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin'
          }
        ]
      }
    }
  },
  {
    method: 'GET',
    endpoint: '/api/users/{id}',
    description: 'Получение пользователя по ID',
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'integer', description: 'ID пользователя' }
    ],
    expectedResponse: {
      status: 200, 
      body: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      }
    }
  },
  {
    method: 'POST',
    endpoint: '/api/users',
    description: 'Создание нового пользователя',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', format: 'email', example: 'john@example.com' },
              password: { type: 'string', format: 'password', example: 'secret123' },
              role: { type: 'string', enum: ['user', 'admin'], default: 'user' }
            }
          }
        }
      }
    },
    expectedResponse: {
      status: 201,
      body: {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      }
    }
  },
  {
    method: 'PUT',
    endpoint: '/api/users/{id}',
    description: 'Обновление пользователя',
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'integer', description: 'ID пользователя' }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Updated Name' },
              email: { type: 'string', format: 'email', example: 'updated@example.com' },
              role: { type: 'string', enum: ['user', 'admin'] }
            }
          }
        }
      }
    },
    expectedResponse: {
      status: 200,
      body: {
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin'
      }
    }
  },
  {
    method: 'DELETE',
    endpoint: '/api/users/{id}',
    description: 'Удаление пользователя',
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'integer', description: 'ID пользователя' }
    ],
    expectedResponse: {
      status: 204,
      body: {}
    }
  },
  {
    method: 'GET',
    endpoint: '/api/products',
    description: 'Получение списка товаров',
    parameters: [
      { name: 'category', in: 'query', required: false, type: 'string', description: 'Фильтр по категории' },
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Максимальное количество элементов в ответе' }
    ],
    expectedResponse: {
      status: 200,
      body: {
        products: [
          {
            id: 1,
            name: 'Product A',
            price: 19.99,
            category: 'electronics'
          }
        ]
      }
    }
  },
  {
    method: 'POST',
    endpoint: '/api/auth/login',
    description: 'Авторизация пользователя',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              password: { type: 'string', format: 'password', example: 'password123' }
            }
          }
        }
      }
    },
    expectedResponse: {
      status: 200,
      body: {
        token: 'jwt-token-example',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    }
  }
];

// Типы ошибок/несоответствий, которые можно внедрить в ответы API
const errorTypes = [
  'missing_field', // Отсутствует поле, которое должно быть согласно документации
  'extra_field',   // Лишнее поле, не указанное в документации
  'wrong_type',    // Неверный тип данных (число вместо строки и т.д.)
  'wrong_format',  // Неверный формат данных (email, дата и т.д.)
  'wrong_status',  // Неверный статус-код ответа
  'wrong_header',  // Неверный заголовок или его отсутствие
  'wrong_value',   // Неверное значение поля
  'no_error'       // Ответ соответствует документации (без ошибок)
];

/**
 * Создает промпт для генерации задания по тестированию API
 * @param {Object} endpoint - Описание API эндпоинта
 * @param {string} errorType - Тип ошибки для внедрения
 * @returns {string} Промпт для OpenAI
 */
function createApiTaskPrompt(endpoint, errorType) {
  return `
Ты - опытный инженер по тестированию API. Создай задание на проверку соответствия API документации и фактических ответов API.

ДОКУМЕНТАЦИЯ API ЭНДПОИНТА:
Метод: ${endpoint.method}
Эндпоинт: ${endpoint.endpoint}
Описание: ${endpoint.description}
${endpoint.parameters && endpoint.parameters.length > 0 ? 
  `Параметры: ${JSON.stringify(endpoint.parameters, null, 2)}` : ''}
${endpoint.requestBody ? 
  `Тело запроса: ${JSON.stringify(endpoint.requestBody, null, 2)}` : ''}
Ожидаемый ответ: ${JSON.stringify(endpoint.expectedResponse, null, 2)}

ЗАДАНИЕ:
Создай задание по тестированию этого API эндпоинта. 

В ответе API нужно внедрить следующий тип ошибки/несоответствия: "${errorType === 'no_error' ? 'Без ошибок (ответ полностью соответствует документации)' : errorType}".

Задание должно включать:
1. Описание задания для студента с чёткими инструкциями
2. Структуру правильного запроса к API (метод, URL, заголовки, тело запроса если необходимо)
3. Ожидаемый ответ от API с внедрённой ошибкой/несоответствием (если указан тип ошибки)
4. Вопрос для проверки, который должен помочь студенту найти несоответствие между документацией и фактическим ответом
5. 4-5 вариантов ответа на вопрос проверки, из которых 1-2 должны быть правильными
6. Список правильных ответов (их значения value) и ключевые слова для оценки свободного ответа

Если тип ошибки "no_error", тогда вопрос проверки должен быть о том, соответствует ли ответ документации, и правильным ответом должно быть подтверждение соответствия.

Верни результат строго в формате JSON без пояснений:
{
  "title": "Краткое название задания",
  "description": "Подробное описание задания для студента",
  "solution": {
    "method": "HTTP метод",
    "url": "URL запроса",
    "headers": {"заголовок": "значение"} или {},
    "body": {} или null
  },
  "mockResponse": {
    "status": 200,
    "headers": {"заголовок": "значение"},
    "body": {}
  },
  "verificationQuestion": "Вопрос для проверки понимания",
  "verificationOptions": [
    { "value": "option1", "label": "Первый вариант ответа" },
    { "value": "option2", "label": "Второй вариант ответа" },
    ...
  ],
  "verification_answers": {
    "beginnerAnswers": ["option2", "option4"],
    "advancedAnswerKeywords": ["ключевое слово 1", "ключевое слово 2", ...]
  }
}

У вариантов ответов должны быть короткие value (1-2 слова на английском) и развернутые label на русском языке.
  `;
}

/**
 * Генерирует набор заданий для одного эндпоинта
 * @param {Object} endpoint - API эндпоинт
 * @param {Array} errorTypesToUse - Типы ошибок для генерации
 * @returns {Promise<Array>} - Массив сгенерированных заданий
 */
async function generateTasksForEndpoint(endpoint, errorTypesToUse) {
  const tasks = [];
  
  for (const errorType of errorTypesToUse) {
    try {
      const prompt = createApiTaskPrompt(endpoint, errorType);
      
      log(`Генерация задания для ${endpoint.method} ${endpoint.endpoint} с ошибкой типа ${errorType}`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4", // или другая доступная модель
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      // Извлекаем JSON из ответа
      const content = response.choices[0].message.content.trim();
      
      let taskData;
      try {
        // Пытаемся распарсить JSON
        taskData = JSON.parse(content);
      } catch (parseError) {
        // Если первая попытка не удалась, ищем JSON в тексте
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          taskData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Не удалось извлечь JSON из ответа ИИ");
        }
      }
      
      tasks.push({
        endpoint: `${endpoint.method} ${endpoint.endpoint}`,
        errorType,
        taskData
      });
      
      // Делаем паузу между запросами к OpenAI
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      
    } catch (error) {
      log(`Ошибка при генерации задания для ${endpoint.method} ${endpoint.endpoint}: ${error.message}`);
      
      // Добавляем базовое задание при ошибке
      tasks.push({
        endpoint: `${endpoint.method} ${endpoint.endpoint}`,
        errorType,
        taskData: {
          title: `Тестирование ${endpoint.method} ${endpoint.endpoint}`,
          description: `Проверьте работу API эндпоинта ${endpoint.method} ${endpoint.endpoint} и найдите несоответствия с документацией.`,
          solution: {
            method: endpoint.method,
            url: endpoint.endpoint,
            headers: {},
            body: null
          },
          mockResponse: endpoint.expectedResponse,
          verificationQuestion: "Соответствует ли ответ API документации?",
          verificationOptions: [
            { value: "correct", label: "Да, ответ полностью соответствует документации" },
            { value: "incorrect", label: "Нет, есть несоответствия" }
          ],
          verification_answers: {
            beginnerAnswers: [errorType === 'no_error' ? "correct" : "incorrect"],
            advancedAnswerKeywords: errorType === 'no_error' ? ["соответствует", "правильно"] : ["ошибка", "несоответствие"]
          }
        }
      });
    }
  }
  
  return tasks;
}

/**
 * Сохраняет задания в MongoDB
 * @param {Array} tasks - Массив сгенерированных заданий
 * @param {string} moduleId - ID модуля
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив сохраненных заданий
 */
async function saveTasksToDB(tasks, moduleId, userId) {
  const savedTasks = [];
  let order = 1;
  
  for (const task of tasks) {
    try {
      const taskData = new Task({
        title: task.taskData.title,
        description: task.taskData.description,
        module: moduleId,
        order: order++,
        type: 'api',
        difficulty: 'medium',
        createdBy: userId,
        solution: task.taskData.solution,
        expectedResponse: {
          status: task.taskData.mockResponse.status,
          exactMatch: false,
          body: {}  // Мы не проверяем тело на точное соответствие через API
        },
        apiSourceRestrictions: ['mock'],
        requiresServerResponse: true,
        verificationQuestion: task.taskData.verificationQuestion,
        verificationOptions: task.taskData.verificationOptions,
        verification_answers: task.taskData.verification_answers
      });
      
      const savedTask = await taskData.save();
      
      savedTasks.push({
        id: savedTask._id,
        title: savedTask.title,
        endpoint: task.endpoint,
        errorType: task.errorType
      });
      
      log(`Создано задание в БД: ${savedTask.title} (ID: ${savedTask._id})`);
      
    } catch (error) {
      log(`Ошибка при сохранении задания в БД: ${error.message}`);
    }
  }
  
  return savedTasks;
}

/**
 * Интерактивный запрос подтверждения от пользователя
 * @param {string} question - Вопрос для пользователя
 * @returns {Promise<boolean>} - Ответ пользователя (true/false)
 */
async function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Главная функция
 */
async function main() {
  try {
    log('=== Запуск генерации заданий по тестированию API ===');

    // Получаем ID модуля, для которого создаем задания
    const moduleId = process.env.MODULE_ID;
    if (!moduleId) {
      log('Ошибка: не указан MODULE_ID в .env файле');
      process.exit(1);
    }

    // Получаем ID пользователя, от имени которого создаем задания
    const userId = process.env.USER_ID;
    if (!userId) {
      log('Ошибка: не указан USER_ID в .env файле');
      process.exit(1);
    }

    // Проверяем количество заданий для создания
    const confirmation = await askForConfirmation(
      `Будет создано примерно ${mockApiEndpoints.length * 2} заданий. Продолжить?`
    );

    if (!confirmation) {
      log('Генерация заданий отменена пользователем');
      process.exit(0);
    }

    const allTasksData = [];
    
    // Генерируем задания для всех эндпоинтов
    for (const endpoint of mockApiEndpoints) {
      // Для каждого эндпоинта создаем 2 задания (с ошибкой и без)
      const errorTypesToUse = [
        errorTypes[Math.floor(Math.random() * (errorTypes.length - 1))], // Случайная ошибка
        'no_error' // Задание без ошибок
      ];
      
      const endpointTasks = await generateTasksForEndpoint(endpoint, errorTypesToUse);
      allTasksData.push(...endpointTasks);
    }
    
    // Сохраняем все задания в один файл
    const allTasksFile = path.join(OUTPUT_DIR, 'all-api-tasks-data.json');
    fs.writeFileSync(allTasksFile, JSON.stringify(allTasksData, null, 2));
    log(`Сгенерированные данные сохранены в: ${allTasksFile}`);
    
    // Сохраняем задания в БД
    const savedTasks = await saveTasksToDB(allTasksData, moduleId, userId);
    
    // Сохраняем итоговый результат
    const finalOutputFile = path.join(OUTPUT_DIR, 'saved-api-tasks.json');
    fs.writeFileSync(finalOutputFile, JSON.stringify(savedTasks, null, 2));

    log(`=== Завершено создание ${savedTasks.length} заданий ===`);
    log(`Результаты сохранены в: ${finalOutputFile}`);

    await mongoose.disconnect();
    log('Соединение с MongoDB закрыто');
    logStream.end();
  } catch (error) {
    log(`Критическая ошибка: ${error.message}`);
    log(error.stack);
    await mongoose.disconnect();
    logStream.end();
    process.exit(1);
  }
}

// Запускаем скрипт
main();