/**
 * Скрипт для создания простых API заданий с верификацией
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');
const fs = require('fs');
const path = require('path');

console.log('Запуск создания простых API заданий для верификации');

// Базовые объекты для заданий
const taskTemplates = [
  // GET /api/users - пример с отсутствующим полем
  {
    title: "Верификация GET /api/users: отсутствующее поле",
    description: "Проверьте ответ API на соответствие документации. В ответе API может отсутствовать важное поле, которое должно быть согласно документации.",
    solution: {
      method: "GET",
      url: "/api/users",
      headers: { "Accept": "application/json" },
      body: null
    },
    mockResponse: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { 
        // Намеренно отсутствует поле users[]
        pagination: { total: 5, page: 1, per_page: 10 }
      }
    },
    verificationQuestion: "Какие несоответствия документации вы видите в ответе API?",
    verificationOptions: [
      { value: "missing_users", label: "Отсутствует обязательное поле 'users'" },
      { value: "wrong_status", label: "Статус-код ответа не соответствует документации" },
      { value: "extra_fields", label: "В ответе присутствуют лишние поля" },
      { value: "no_issues", label: "Ответ полностью соответствует документации" }
    ],
    verification_answers: {
      beginnerAnswers: ["missing_users"],
      advancedAnswerKeywords: ["отсутствует", "пользователи", "массив users", "обязательное поле"]
    }
  },
  
  // GET /api/users - пример без ошибок
  {
    title: "Верификация GET /api/users: корректный ответ",
    description: "Проверьте ответ API на соответствие документации. Сравните фактический ответ с ожидаемым согласно документации.",
    solution: {
      method: "GET",
      url: "/api/users",
      headers: { "Accept": "application/json" },
      body: null
    },
    mockResponse: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { 
        users: [
          { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
          { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" }
        ]
      }
    },
    verificationQuestion: "Соответствует ли ответ API документации?",
    verificationOptions: [
      { value: "correct", label: "Да, ответ полностью соответствует документации" },
      { value: "missing_fields", label: "Нет, отсутствуют обязательные поля" },
      { value: "wrong_status", label: "Нет, неверный статус-код ответа" },
      { value: "wrong_format", label: "Нет, неверный формат данных" }
    ],
    verification_answers: {
      beginnerAnswers: ["correct"],
      advancedAnswerKeywords: ["соответствует", "корректно", "правильно"]
    }
  },
  
  // POST /api/users - неверный тип данных
  {
    title: "Верификация POST /api/users: неверный тип данных",
    description: "Проверьте ответ API на соответствие документации. В ответе API может быть несоответствие типа данных.",
    solution: {
      method: "POST",
      url: "/api/users",
      headers: { 
        "Accept": "application/json", 
        "Content-Type": "application/json" 
      },
      body: {
        name: "New User",
        email: "new@example.com",
        password: "secret123",
        role: "user"
      }
    },
    mockResponse: {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: { 
        id: "2",  // Должно быть числом, но в ответе строка
        name: "New User",
        email: "new@example.com",
        role: "user"
      }
    },
    verificationQuestion: "Какое несоответствие документации вы видите в ответе API?",
    verificationOptions: [
      { value: "id_string", label: "Поле id имеет тип строка вместо числа" },
      { value: "wrong_status", label: "Неверный статус-код ответа" },
      { value: "missing_fields", label: "Отсутствуют обязательные поля" },
      { value: "no_issues", label: "Ответ полностью соответствует документации" }
    ],
    verification_answers: {
      beginnerAnswers: ["id_string"],
      advancedAnswerKeywords: ["id", "тип", "строка", "число", "неверный тип"]
    }
  },
  
  // GET /api/users/{id} - неверный статус
  {
    title: "Верификация GET /api/users/{id}: неверный статус",
    description: "Проверьте ответ API на соответствие документации. В ответе API может быть неверный статус-код.",
    solution: {
      method: "GET",
      url: "/api/users/1",
      headers: { "Accept": "application/json" },
      body: null
    },
    mockResponse: {
      status: 404,  // По документации должен быть 200
      headers: { "Content-Type": "application/json" },
      body: { 
        error: "User not found",
        code: "resource_not_found"
      }
    },
    verificationQuestion: "Какое несоответствие документации вы видите в ответе API?",
    verificationOptions: [
      { value: "wrong_status", label: "Неверный статус-код ответа (404 вместо 200)" },
      { value: "wrong_body", label: "Формат тела ответа не соответствует документации" },
      { value: "missing_fields", label: "Отсутствуют обязательные поля в ответе" },
      { value: "no_issues", label: "Ответ полностью соответствует документации" }
    ],
    verification_answers: {
      beginnerAnswers: ["wrong_status"],
      advancedAnswerKeywords: ["статус", "404", "ошибка", "не существует"]
    }
  },
  
  // DELETE /api/users/{id} - лишние поля
  {
    title: "Верификация DELETE /api/users/{id}: лишние поля",
    description: "Проверьте ответ API на соответствие документации. В ответе API могут быть лишние поля, которых нет в документации.",
    solution: {
      method: "DELETE",
      url: "/api/users/1",
      headers: { "Accept": "application/json" },
      body: null
    },
    mockResponse: {
      status: 204,
      headers: { "Content-Type": "application/json" },
      body: {  // По документации должно быть пустое тело {}
        status: "success",
        message: "User deleted successfully",
        timestamp: "2024-04-15T12:00:00Z"
      }
    },
    verificationQuestion: "Какое несоответствие документации вы видите в ответе API?",
    verificationOptions: [
      { value: "extra_fields", label: "В ответе присутствуют лишние поля, которых нет в документации" },
      { value: "wrong_status", label: "Неверный статус-код ответа" },
      { value: "wrong_content_type", label: "Неверный заголовок Content-Type" },
      { value: "no_issues", label: "Ответ полностью соответствует документации" }
    ],
    verification_answers: {
      beginnerAnswers: ["extra_fields"],
      advancedAnswerKeywords: ["лишние", "дополнительные", "поля", "не в документации"]
    }
  }
];

// Основная функция
async function createTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB подключена');

    // ID модуля
    const moduleId = process.env.MODULE_ID;
    // ID пользователя
    const userId = process.env.USER_ID;

    if (\!moduleId || \!userId) {
      console.error('Ошибка: не указаны MODULE_ID или USER_ID в .env файле');
      process.exit(1);
    }

    // Удаляем существующие задания в этом модуле
    const deleteResult = await Task.deleteMany({ module: moduleId });
    console.log('Удалено заданий:', deleteResult.deletedCount);

    // Сохраняем новые задания
    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];
      
      const taskData = {
        title: template.title,
        description: template.description,
        module: moduleId,
        order: i + 1,
        type: 'api',
        difficulty: 'medium',
        createdBy: userId,
        solution: template.solution,
        expectedResponse: {
          status: template.mockResponse.status,
          exactMatch: false,
          body: {}
        },
        apiSourceRestrictions: ['mock'],
        requiresServerResponse: true,
        verificationQuestion: template.verificationQuestion,
        verificationOptions: template.verificationOptions,
        verification_answers: template.verification_answers
      };

      const task = new Task(taskData);
      const savedTask = await task.save();
      
      console.log('Создано задание:', savedTask.title);
    }

    console.log('Все задания успешно созданы\!');
    await mongoose.disconnect();
    console.log('Соединение с MongoDB закрыто');
  } catch (error) {
    console.error('Ошибка:', error);
    await mongoose.disconnect();
  }
}

// Запуск скрипта
createTasks();
