/**
 * Скрипт для автоматической генерации проверочных вопросов для всех заданий
 * с помощью ChatGPT с анализом контекста задания
 * 
 * Запуск:
 * node generate-all-verification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Task = require('./server/models/Task');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Настройка лимитов и конфигурации
const BATCH_SIZE = 10; // Количество заданий для обработки за один раз
const DELAY_BETWEEN_REQUESTS = 3000; // 3 секунды задержки между запросами к API
const OUTPUT_DIR = path.join(__dirname, 'verification-output');
const LOG_FILE = path.join(OUTPUT_DIR, 'generation-log.txt');

// Создаем директорию для выходных данных, если она не существует
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Настройка логирования
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => log('MongoDB подключена...'))
.catch(err => {
  log(`Ошибка подключения к MongoDB: ${err.message}`);
  process.exit(1);
});

// Инициализация клиента OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Функция для анализа задания и генерации проверочного вопроса
 * @param {Object} task - Объект задания
 * @returns {Promise<Object>} - Сгенерированный проверочный вопрос
 */
async function analyzeAndGenerateVerification(task) {
  // Собираем всю доступную информацию о задании
  const taskContext = {
    id: task._id,
    title: task.title,
    description: task.description || '',
    difficulty: task.difficulty,
    type: task.type,
    tags: task.tags || [],
    requirements: task.requirements || [],
    expectedResult: task.expectedResult || '',
    solution: task.solution || {}
  };

  // Определяем особенности задания для улучшения качества вопросов
  let taskType = 'general';
  if (task.solution && task.solution.method) {
    taskType = task.solution.method.toLowerCase();
  } else if (task.tags && task.tags.length > 0) {
    if (task.tags.some(tag => ['auth', 'authentication', 'authorization'].includes(tag.toLowerCase()))) {
      taskType = 'auth';
    } else if (task.tags.some(tag => ['error', 'validation', 'error-handling'].includes(tag.toLowerCase()))) {
      taskType = 'error';
    } else {
      // Ищем HTTP метод в тегах
      const httpMethod = task.tags.find(tag => ['get', 'post', 'put', 'delete', 'patch'].includes(tag.toLowerCase()));
      if (httpMethod) taskType = httpMethod.toLowerCase();
    }
  }

  // Создаем промпт для модели с учетом контекста задания
  const prompt = `
  Ты эксперт по API и тестированию. Проанализируй задание по тестированию API и создай соответствующий проверочный вопрос с вариантами ответов.
  
  Детали задания:
  - ID: ${taskContext.id}
  - Название: "${taskContext.title}"
  - Описание: "${taskContext.description}"
  - Сложность: "${taskContext.difficulty}"
  - Тип: "${taskContext.type}"
  - Теги: ${JSON.stringify(taskContext.tags)}
  - Требования: ${JSON.stringify(taskContext.requirements)}
  - Ожидаемый результат: "${taskContext.expectedResult}"
  - HTTP метод: "${taskContext.solution.method || 'Не указан'}"
  - URL: "${taskContext.solution.url || 'Не указан'}"
  
  Тип API операции: ${taskType.toUpperCase()}
  
  Создай вопрос, который проверяет понимание важных аспектов при работе с этим типом API операции. 
  Включи следующее:
  1. Вопрос, связанный с API концепциями, относящимися к этому заданию
  2. 5 вариантов ответов (из которых 2-3 должны быть правильными)
  3. Корректные ответы (их значения value)
  4. Ключевые слова для оценки свободного ответа
  
  Вопрос должен быть сфокусирован на:
  - Для GET запросов: правильное формирование запроса, параметры, обработка ответа
  - Для POST запросов: структура тела запроса, валидация данных, заголовки
  - Для PUT/PATCH: идемпотентность, обновление ресурсов, различия между методами
  - Для DELETE: проверка удаления, возможные статус-коды, обработка ошибок
  - Для AUTH: методы авторизации, токены, безопасность
  - Для ERROR: обработка ошибок, валидация, статус-коды ошибок
  
  Верни результат строго в формате JSON без пояснений:
  {
    "verificationQuestion": "Текст вопроса",
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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // или другая модель в зависимости от доступа
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Извлекаем JSON из ответа
    const content = response.choices[0].message.content.trim();
    
    try {
      // Пытаемся распарсить JSON
      return JSON.parse(content);
    } catch (parseError) {
      // Если первая попытка не удалась, ищем JSON в тексте
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Не удалось извлечь JSON из ответа ИИ");
      }
    }
  } catch (error) {
    log(`Ошибка при генерации для задания ${task.title}: ${error.message}`);
    
    // Возвращаем запасной вариант
    return {
      verificationQuestion: `Что важно учесть при тестировании API для ${task.title}?`,
      verificationOptions: [
        { value: "correct-method", label: "Использовать правильный HTTP метод" },
        { value: "valid-params", label: "Передавать корректные параметры" },
        { value: "auth-headers", label: "Включать необходимые заголовки авторизации" },
        { value: "check-status", label: "Проверять статус-код ответа" },
        { value: "validate-body", label: "Валидировать тело ответа" }
      ],
      verification_answers: {
        beginnerAnswers: ["correct-method", "check-status", "validate-body"],
        advancedAnswerKeywords: ["http метод", "статус-код", "тело ответа", "валидация"]
      }
    };
  }
}

/**
 * Обработка пакета заданий
 * @param {Array} tasks - Массив заданий для обработки
 * @returns {Promise<Array>} - Результаты обработки
 */
async function processBatch(tasks) {
  const results = [];
  
  for (const task of tasks) {
    log(`Обработка задания: ${task.title} (ID: ${task._id})`);
    
    try {
      // Генерация проверочного вопроса с анализом
      const verification = await analyzeAndGenerateVerification(task);
      
      // Сохранение в БД
      task.verificationQuestion = verification.verificationQuestion;
      task.verificationOptions = verification.verificationOptions;
      task.verification_answers = verification.verification_answers;
      
      await task.save();
      
      // Сохранение результата
      results.push({
        taskId: task._id,
        title: task.title,
        success: true,
        verification
      });
      
      log(`✅ Успешно обновлено задание: ${task.title}`);
    } catch (error) {
      log(`❌ Ошибка обработки задания ${task.title}: ${error.message}`);
      
      results.push({
        taskId: task._id,
        title: task.title,
        success: false,
        error: error.message
      });
    }
    
    // Добавляем задержку между запросами для снижения нагрузки на API
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
  
  return results;
}

/**
 * Задержка выполнения
 * @param {number} ms - Количество миллисекунд для задержки
 * @returns {Promise} - Промис, который разрешится после указанной задержки
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Интерактивный запрос подтверждения от пользователя
 * @param {string} question - Вопрос для пользователя
 * @returns {Promise<boolean>} - Ответ пользователя
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
 * Главная функция скрипта
 */
async function main() {
  try {
    log('Начало процесса генерации проверочных вопросов');
    
    // 1. Получаем все задания
    const totalTasks = await Task.countDocuments();
    log(`Всего найдено заданий в базе данных: ${totalTasks}`);
    
    // 2. Определяем, какие задания обрабатывать
    const tasksQuery = { };
    
    // Опционально: можно ограничить запрос только заданиями без проверочных вопросов
    // const tasksQuery = { verificationQuestion: { $exists: false } };
    
    const tasksToProcess = await Task.countDocuments(tasksQuery);
    log(`Заданий для обработки: ${tasksToProcess}`);
    
    // 3. Запрашиваем подтверждение
    const proceed = await askForConfirmation(
      `Будет сгенерировано ${tasksToProcess} проверочных вопросов. Это может занять время и потребовать ресурсы API. Продолжить?`
    );
    
    if (!proceed) {
      log('Операция отменена пользователем');
      await mongoose.disconnect();
      return;
    }
    
    // 4. Обработка заданий пакетами
    let processedCount = 0;
    let successes = 0;
    let failures = 0;
    const allResults = [];
    
    // Определяем общее количество пакетов
    const totalBatches = Math.ceil(tasksToProcess / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Получаем текущий пакет заданий
      const tasksBatch = await Task.find(tasksQuery)
        .skip(batchIndex * BATCH_SIZE)
        .limit(BATCH_SIZE);
      
      log(`Обработка пакета ${batchIndex + 1} из ${totalBatches} (${tasksBatch.length} заданий)`);
      
      // Обрабатываем пакет
      const batchResults = await processBatch(tasksBatch);
      
      // Анализируем результаты пакета
      batchResults.forEach(result => {
        allResults.push(result);
        processedCount++;
        
        if (result.success) {
          successes++;
        } else {
          failures++;
        }
      });
      
      // Сохраняем промежуточные результаты
      const outputFile = path.join(OUTPUT_DIR, `batch-${batchIndex + 1}-results.json`);
      fs.writeFileSync(outputFile, JSON.stringify(batchResults, null, 2));
      
      log(`Прогресс: ${processedCount}/${tasksToProcess} (${Math.round(processedCount / tasksToProcess * 100)}%)`);
      log(`Успешно: ${successes}, Ошибок: ${failures}`);
      
      // Добавляем задержку между пакетами
      if (batchIndex < totalBatches - 1) {
        log(`Пауза перед следующим пакетом...`);
        await delay(5000); // 5 секунд между пакетами
      }
    }
    
    // 5. Сохраняем итоговые результаты
    const finalOutputFile = path.join(OUTPUT_DIR, 'final-results.json');
    fs.writeFileSync(finalOutputFile, JSON.stringify(allResults, null, 2));
    
    // 6. Выводим итоговую статистику
    log('\n=== Итоги выполнения ===');
    log(`Всего обработано заданий: ${processedCount}`);
    log(`Успешно обновлено: ${successes}`);
    log(`Ошибок: ${failures}`);
    log(`Результаты сохранены в: ${finalOutputFile}`);
    
    // 7. Закрываем соединение с БД
    await mongoose.disconnect();
    log('Соединение с БД закрыто');
    
  } catch (error) {
    log(`Критическая ошибка: ${error.message}`);
    log(error.stack);
    await mongoose.disconnect();
  } finally {
    // Закрываем лог-файл
    logStream.end();
  }
}

// Запуск скрипта
main();