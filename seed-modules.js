// Скрипт для добавления модулей и заданий в MongoDB
// Запуск: mongosh api-quest seed-modules.js

const courseId = ObjectId("67eeb8b77b56a0d8dd1ae639"); // API Fundamentals
const userId = ObjectId("67ee6371bfa4aed2fecd5301"); // First user

// Удаляем существующие модули и задания для курса, если они есть
db.modules.deleteMany({ course: courseId });
print("Существующие модули для курса удалены");

// Создаем модули для курса API Fundamentals
const modules = [
  {
    title: "Основы HTTP и тестирования API",
    description: "В этом модуле вы познакомитесь с основами протокола HTTP, узнаете о методах запросов, статус-кодах ответов и структуре HTTP сообщений. Вы поймете, как работает веб на базовом уровне и почему важно тестировать API.",
    shortDescription: "Изучение протокола HTTP и основ тестирования API",
    order: 1,
    course: courseId,
    duration: 60,
    isActive: true,
    isLocked: false,
    tags: ["HTTP", "Protocol", "Testing Basics"],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "RESTful API и принципы тестирования",
    description: "Этот модуль посвящен архитектуре REST (Representational State Transfer) и методикам тестирования RESTful API. Вы изучите принципы проектирования RESTful API, научитесь определять тестовые случаи для проверки API на соответствие принципам REST.",
    shortDescription: "Принципы REST и подходы к тестированию API",
    order: 2,
    course: courseId,
    duration: 90,
    isActive: true,
    isLocked: false,
    tags: ["REST", "API Testing", "Test Cases"],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Инструменты тестирования API",
    description: "В этом модуле вы познакомитесь с популярными инструментами для тестирования API, включая Postman, Insomnia, cURL и другие. Вы научитесь создавать и отправлять различные типы запросов, проверять ответы и автоматизировать тестирование.",
    shortDescription: "Работа с инструментами для тестирования API",
    order: 3,
    course: courseId,
    duration: 120,
    isActive: true,
    isLocked: true,
    tags: ["Tools", "Postman", "Automation"],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Тестирование безопасности API",
    description: "Этот модуль фокусируется на тестировании безопасности API. Вы узнаете о распространенных уязвимостях API, методах аутентификации и авторизации, а также о том, как проверить API на наличие проблем с безопасностью.",
    shortDescription: "Проверка API на уязвимости и проблемы безопасности",
    order: 4,
    course: courseId,
    duration: 150,
    isActive: true,
    isLocked: true,
    tags: ["Security", "Authentication", "Authorization", "Vulnerabilities"],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Добавляем модули
const moduleIds = db.modules.insertMany(modules).insertedIds;
print("Модули добавлены, полученные ID:");
printjson(moduleIds);

// Устанавливаем зависимости между модулями
db.modules.updateOne(
  { _id: moduleIds[2] }, // Третий модуль (Инструменты тестирования API)
  { $set: { requiredModules: [moduleIds[0], moduleIds[1]] } } // Требует первый и второй модули
);

db.modules.updateOne(
  { _id: moduleIds[3] }, // Четвертый модуль (Тестирование безопасности API)
  { $set: { requiredModules: [moduleIds[2]] } } // Требует третий модуль
);

print("Зависимости между модулями установлены");

// Создаем задания для первого модуля "Основы HTTP и тестирования API"
const module1Tasks = [
  {
    title: "Анализ HTTP запроса и ответа",
    description: "В этом задании вам нужно выполнить GET запрос и проанализировать структуру HTTP запроса и ответа, включая заголовки, статус-код и тело ответа.",
    module: moduleIds[0],
    order: 1,
    difficulty: "easy",
    type: "api",
    duration: 15,
    points: 10,
    tags: ["GET", "HTTP", "Headers", "Status Code"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "GET",
      url: "/api/users",
      headers: {
        "Accept": "application/json"
      }
    },
    expectedResponse: {
      status: 200,
      body: {
        "users": true
      }
    },
    hints: [
      "Используйте метод GET для получения данных",
      "Обратите внимание на заголовки запроса и ответа",
      "Проверьте статус-код ответа и его значение"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Работа с различными статус-кодами",
    description: "В этом задании вы будете работать с различными HTTP статус-кодами и научитесь интерпретировать их значения. Выполните запросы, которые вернут коды из разных категорий (2xx, 4xx, 5xx).",
    module: moduleIds[0],
    order: 2,
    difficulty: "medium",
    type: "api",
    duration: 20,
    points: 15,
    tags: ["Status Codes", "HTTP", "Error Handling"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "GET",
      url: "/api/status/404",
      headers: {}
    },
    expectedResponse: {
      status: 404
    },
    hints: [
      "Используйте различные URL для получения разных статус-кодов",
      "Для кода 404 используйте несуществующий ресурс",
      "Обратите внимание на сообщения об ошибках в теле ответа"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "HTTP заголовки и их значения",
    description: "В этом задании вы изучите различные HTTP заголовки и их применение в API. Вам нужно будет отправить запрос с определенными заголовками и проанализировать заголовки ответа.",
    module: moduleIds[0],
    order: 3,
    difficulty: "medium",
    type: "api",
    duration: 25,
    points: 20,
    tags: ["Headers", "HTTP", "Content-Type"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "GET",
      url: "/api/headers",
      headers: {
        "Accept": "application/json",
        "X-Request-ID": "test-request-123"
      }
    },
    expectedResponse: {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        "headers_received": true
      }
    },
    hints: [
      "Отправьте заголовок Accept с значением application/json",
      "Добавьте собственный заголовок X-Request-ID для отслеживания запроса",
      "Проанализируйте заголовки в ответе сервера"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Создаем задания для второго модуля "RESTful API и принципы тестирования"
const module2Tasks = [
  {
    title: "Тестирование CRUD операций",
    description: "В этом задании вы научитесь тестировать CRUD операции (Create, Read, Update, Delete) в RESTful API. Вам нужно будет создать ресурс, получить его, обновить и удалить, проверяя корректность каждой операции.",
    module: moduleIds[1],
    order: 1,
    difficulty: "medium",
    type: "api",
    duration: 30,
    points: 25,
    tags: ["CRUD", "REST", "Testing"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "POST",
      url: "/api/products",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: {
        "name": "Test Product",
        "price": 99.99
      }
    },
    expectedResponse: {
      status: 201,
      body: {
        "id": true,
        "name": "Test Product",
        "price": 99.99
      }
    },
    hints: [
      "Начните с создания ресурса с помощью POST запроса",
      "Используйте полученный ID для последующих операций: GET, PUT/PATCH и DELETE",
      "Проверяйте соответствующие статус-коды для каждой операции: 201, 200, 204"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Проверка валидации данных API",
    description: "В этом задании вы будете тестировать валидацию данных в API. Вам нужно будет отправить некорректные данные и проверить, как API обрабатывает ошибки и сообщает о них.",
    module: moduleIds[1],
    order: 2,
    difficulty: "medium",
    type: "api",
    duration: 25,
    points: 20,
    tags: ["Validation", "Error Handling", "Testing"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "POST",
      url: "/api/users",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: {
        "email": "invalid-email"
      }
    },
    expectedResponse: {
      status: 400,
      body: {
        "error": true,
        "message": true,
        "validation": true
      }
    },
    hints: [
      "Отправьте данные с некорректным форматом email",
      "Проверьте, что API возвращает статус 400 Bad Request",
      "Убедитесь, что ответ содержит информацию о конкретной проблеме валидации"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Создание тестовых сценариев для API",
    description: "В этом задании вы научитесь создавать эффективные тестовые сценарии для API. Вам нужно будет определить позитивные и негативные сценарии, краевые случаи и проверить поведение API в этих ситуациях.",
    module: moduleIds[1],
    order: 3,
    difficulty: "hard",
    type: "exercise",
    duration: 45,
    points: 30,
    tags: ["Test Cases", "Test Design", "Testing Strategy"],
    isActive: true,
    requiresServerResponse: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Создаем задания для третьего модуля "Инструменты тестирования API"
const module3Tasks = [
  {
    title: "Использование Postman для тестирования API",
    description: "В этом задании вы научитесь использовать Postman для отправки запросов и проверки ответов API. Вы создадите коллекцию запросов и напишете простые тесты в Postman.",
    module: moduleIds[2],
    order: 1,
    difficulty: "medium",
    type: "exercise",
    duration: 40,
    points: 25,
    tags: ["Postman", "Tools", "Testing"],
    isActive: true,
    requiresServerResponse: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Автоматизация тестирования API",
    description: "В этом задании вы познакомитесь с автоматизацией тестирования API с помощью скриптов и инструментов командной строки. Вы научитесь запускать тесты API в автоматическом режиме.",
    module: moduleIds[2],
    order: 2,
    difficulty: "hard",
    type: "api",
    duration: 50,
    points: 35,
    tags: ["Automation", "Scripts", "CI/CD"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "GET",
      url: "/api/automated-test",
      headers: {
        "Accept": "application/json"
      }
    },
    expectedResponse: {
      status: 200,
      body: {
        "success": true
      }
    },
    hints: [
      "Создайте скрипт для автоматизации тестирования API",
      "Используйте curl или подобные инструменты для запросов в скрипте",
      "Добавьте проверки результатов и генерацию отчетов о тестировании"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Создаем задания для четвертого модуля "Тестирование безопасности API"
const module4Tasks = [
  {
    title: "Проверка аутентификации и авторизации",
    description: "В этом задании вы научитесь тестировать механизмы аутентификации и авторизации в API. Вы будете проверять доступ к защищенным ресурсам с различными уровнями прав.",
    module: moduleIds[3],
    order: 1,
    difficulty: "hard",
    type: "api",
    duration: 45,
    points: 30,
    tags: ["Authentication", "Authorization", "Security"],
    apiSourceRestrictions: ["mock"],
    solution: {
      method: "GET",
      url: "/api/protected-resource",
      headers: {
        "Authorization": "Bearer token123",
        "Accept": "application/json"
      }
    },
    expectedResponse: {
      status: 200,
      body: {
        "protected_data": true
      }
    },
    hints: [
      "Используйте токен JWT для аутентификации",
      "Проверьте доступ к ресурсам с разными уровнями прав",
      "Убедитесь, что неавторизованные запросы правильно отклоняются"
    ],
    isActive: true,
    requiresServerResponse: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Тестирование на распространенные уязвимости API",
    description: "В этом задании вы научитесь выявлять и тестировать распространенные уязвимости API, такие как SQL-инъекции, XSS, CSRF и другие. Вы поймете, как проверить API на наличие этих проблем безопасности.",
    module: moduleIds[3],
    order: 2,
    difficulty: "expert",
    type: "exercise",
    duration: 60,
    points: 40,
    tags: ["Vulnerabilities", "Security Testing", "OWASP"],
    isActive: true,
    requiresServerResponse: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Объединяем все задания
const allTasks = [
  ...module1Tasks,
  ...module2Tasks,
  ...module3Tasks,
  ...module4Tasks
];

// Добавляем задания в базу данных
const taskIds = db.tasks.insertMany(allTasks).insertedIds;
print("Задания добавлены, полученные ID:");
printjson(taskIds);

print("Модули и задания успешно добавлены в базу данных");