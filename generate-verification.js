/**
 * Скрипт для генерации проверочных вопросов с помощью ChatGPT
 * 
 * Перед запуском установите: npm install openai dotenv
 * 
 * Запуск:
 * node generate-verification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Task = require('./server/models/Task');
const fs = require('fs');

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB подключена...'))
.catch(err => {
  console.error('Ошибка подключения к MongoDB:', err);
  process.exit(1);
});

// Инициализация клиента OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Используем существующий ключ из .env
});

/**
 * Генерация проверочных вопросов с помощью ChatGPT
 * @param {Object} task - Объект задания
 * @returns {Promise<Object>} - Сгенерированный проверочный вопрос
 */
async function generateVerification(task) {
  const prompt = `
  Я хочу создать проверочный вопрос с вариантами ответов для задания по тестированию API.
  
  Информация о задании:
  - Название: "${task.title}"
  - Описание: "${task.description || 'Не указано'}"
  - Тип задания: "${task.type}"
  - Сложность: "${task.difficulty}"
  
  Ожидаемый результат: "${task.expectedResult || 'Успешное выполнение API запроса'}"
  
  Я хочу получить:
  1. Вопрос для проверки понимания концепций API, связанных с этим заданием
  2. 5 вариантов ответов (только 2-3 должны быть правильными)
  3. Указание, какие ответы являются правильными
  
  Пожалуйста, верни ответ в JSON формате:
  {
    "verificationQuestion": "Текст вопроса",
    "verificationOptions": [
      { "value": "option1", "label": "Первый вариант ответа" },
      { "value": "option2", "label": "Второй вариант ответа" },
      ...
    ],
    "verification_answers": {
      "beginnerAnswers": ["option2", "option4"], 
      "advancedAnswerKeywords": ["ключевое слово 1", "ключевое слово 2"]
    }
  }
  
  Варианты ответов должны содержать как правильные, так и неправильные утверждения. Вопросы должны быть сфокусированы на проверке понимания HTTP методов, статус-кодов, структуры запросов и ответов, а также потенциальных проблем и ошибок.
  
  У ответов должны быть короткие value (1-2 слова на английском) и развернутые label на русском языке.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // или "gpt-3.5-turbo", в зависимости от вашей подписки
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Извлекаем JSON из ответа
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Не удалось извлечь JSON из ответа ИИ");
    }
  } catch (error) {
    console.error('Ошибка при генерации вопросов с помощью ChatGPT:', error);
    // Возвращаем заглушку в случае ошибки
    return {
      verificationQuestion: `Что нужно проверить при тестировании ${task.title}?`,
      verificationOptions: [
        { value: "status-code", label: "Проверить корректность статус-кода" },
        { value: "response-structure", label: "Проверить структуру ответа" },
        { value: "auth-headers", label: "Проверить заголовки авторизации" },
        { value: "error-handling", label: "Проверить обработку ошибок" },
        { value: "performance", label: "Проверить производительность API" }
      ],
      verification_answers: {
        beginnerAnswers: ["status-code", "response-structure"],
        advancedAnswerKeywords: ["статус", "код", "структура", "ответ"]
      }
    };
  }
}

/**
 * Функция для обновления заданий с проверочными вопросами
 */
const generateAndUpdateTasks = async () => {
  try {
    // Получение заданий без проверочных вопросов
    const tasks = await Task.find({ verificationQuestion: { $exists: false } })
      .limit(5); // ограничиваем количество заданий для генерации
    
    if (tasks.length === 0) {
      console.log('Не найдено заданий без проверочных вопросов');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Найдено ${tasks.length} заданий без проверочных вопросов`);
    
    const generatedData = [];
    let updated = 0;
    
    for (const task of tasks) {
      console.log(`Генерация проверочных вопросов для задания "${task.title}"...`);
      
      try {
        // Генерация проверочных вопросов
        const verification = await generateVerification(task);
        
        // Сохранение данных для backup
        generatedData.push({
          taskId: task._id,
          ...verification
        });
        
        // Обновление задания
        task.verificationQuestion = verification.verificationQuestion;
        task.verificationOptions = verification.verificationOptions;
        task.verification_answers = verification.verification_answers;
        
        await task.save();
        updated++;
        console.log(`Задание "${task.title}" обновлено с проверочными вопросами`);
      } catch (err) {
        console.error(`Ошибка при обновлении задания "${task.title}":`, err);
      }
    }
    
    // Сохранение сгенерированных данных в файл для бэкапа
    fs.writeFileSync(
      'generated-verification-data.json', 
      JSON.stringify(generatedData, null, 2)
    );
    
    console.log('\nГенерация проверочных вопросов завершена');
    console.log(`Обновлено ${updated} из ${tasks.length} заданий`);
    console.log('Данные сохранены в generated-verification-data.json');
    
    // Отключение от базы данных
    await mongoose.disconnect();
    console.log('MongoDB отключена');
  } catch (error) {
    console.error('Ошибка при обновлении заданий:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Запуск генерации и обновления
generateAndUpdateTasks();