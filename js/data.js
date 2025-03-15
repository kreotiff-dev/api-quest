// Массив заданий
const tasks = [
  {
      id: 1,
      title: "Базовый GET запрос",
      subtitle: "Основы HTTP запросов",
      description: "Научитесь создавать простые GET запросы для получения данных с сервера.",
      category: "basics",
      difficulty: "easy",
      status: "not_started",
      tags: ["GET", "Основы"],
      requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/users",
          "Не требуется дополнительных заголовков"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать массив пользователей в формате JSON.",
      solution: {
          url: "/api/users",
          method: "GET",
          headers: {},
          body: ""
      }
  },
  {
      id: 2,
      title: "Создание нового пользователя",
      subtitle: "Работа с POST запросами",
      description: "Изучите, как создавать ресурсы на сервере с помощью POST запросов и передачи данных в формате JSON.",
      category: "http",
      difficulty: "medium",
      status: "not_started",
      tags: ["POST", "JSON"],
      requirements: [
          "Использовать метод POST",
          "URL эндпоинта: /api/users",
          "Заголовок Content-Type: application/json",
          "Тело запроса должно содержать JSON-объект со следующими полями:",
          "- name: строка с именем пользователя",
          "- email: строка с корректным email",
          "- role: строка с ролью (admin или user)"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 201 Created и содержать созданного пользователя с присвоенным id в формате JSON.",
      solution: {
          url: "/api/users",
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: {
              name: true,
              email: true,
              role: true
          }
      }
  },
  {
      id: 3,
      title: "Фильтрация данных",
      subtitle: "Использование параметров запроса",
      description: "Узнайте, как использовать параметры запроса для фильтрации и сортировки данных, получаемых от сервера.",
      category: "basics",
      difficulty: "easy",
      status: "completed",
      tags: ["GET", "Query Parameters"],
      requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/users",
          "Добавить параметр запроса role=admin для фильтрации пользователей по роли",
          "Добавить параметр запроса limit=10 для ограничения количества результатов"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать отфильтрованный массив пользователей с ролью admin, ограниченный 10 записями.",
      solution: {
          url: "/api/users?role=admin&limit=10",
          method: "GET",
          headers: {},
          body: ""
      }
  },
  {
      id: 4,
      title: "Аутентификация с API ключом",
      subtitle: "Безопасность API",
      description: "Изучите основы защиты API с использованием ключей доступа, передаваемых в заголовках запроса.",
      category: "auth",
      difficulty: "medium",
      status: "in_progress",
      tags: ["Аутентификация", "API Key"],
      requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/secure-data",
          "Добавить заголовок X-API-Key со значением your_api_key_123"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать защищенные данные. Без корректного API-ключа сервер вернет статус 401 Unauthorized.",
      solution: {
          url: "/api/secure-data",
          method: "GET",
          headers: {
              "X-API-Key": "your_api_key_123"
          },
          body: ""
      }
  },
  {
      id: 5,
      title: "Обновление ресурса",
      subtitle: "Использование PUT запросов",
      description: "Научитесь обновлять существующие ресурсы на сервере с помощью PUT запросов и передачи обновленных данных.",
      category: "http",
      difficulty: "medium",
      status: "not_started",
      tags: ["PUT", "JSON"],
      requirements: [
          "Использовать метод PUT",
          "URL эндпоинта: /api/users/42",
          "Заголовок Content-Type: application/json",
          "Тело запроса должно содержать обновленные данные пользователя:",
          "- name: новое имя пользователя",
          "- email: новый email",
          "- role: новая роль"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать обновленного пользователя в формате JSON.",
      solution: {
          url: "/api/users/42",
          method: "PUT",
          headers: {
              "Content-Type": "application/json"
          },
          body: {
              name: true,
              email: true,
              role: true
          }
      }
  },
  {
      id: 6,
      title: "Удаление ресурса",
      subtitle: "Использование DELETE запросов",
      description: "Изучите, как удалять ресурсы на сервере с помощью DELETE запросов.",
      category: "http",
      difficulty: "easy",
      status: "not_started",
      tags: ["DELETE"],
      requirements: [
          "Использовать метод DELETE",
          "URL эндпоинта: /api/users/42",
          "Не требуется тело запроса"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 204 No Content без тела ответа.",
      solution: {
          url: "/api/users/42",
          method: "DELETE",
          headers: {},
          body: ""
      }
  },
  {
      id: 7,
      title: "OAuth 2.0 авторизация",
      subtitle: "Продвинутые методы аутентификации",
      description: "Изучите современный стандарт авторизации OAuth 2.0 для доступа к защищенным ресурсам API.",
      category: "auth",
      difficulty: "hard",
      status: "locked",
      tags: ["OAuth", "Авторизация", "Bearer Token"],
      requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/protected-resource",
          "Заголовок Authorization: Bearer {token}",
          "Заменить {token} на полученный токен доступа"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать защищенные данные. Без корректного токена сервер вернет статус 401 Unauthorized.",
      solution: {
          url: "/api/protected-resource",
          method: "GET",
          headers: {
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ"
          },
          body: ""
      }
  },
  {
      id: 8,
      title: "Загрузка файлов",
      subtitle: "Работа с multipart/form-data",
      description: "Научитесь загружать файлы на сервер через API с использованием multipart/form-data.",
      category: "http",
      difficulty: "hard",
      status: "not_started",
      tags: ["POST", "multipart/form-data", "Upload"],
      requirements: [
          "Использовать метод POST",
          "URL эндпоинта: /api/upload",
          "Content-Type: multipart/form-data",
          "Добавить поле file с файлом для загрузки",
          "Добавить поле description с описанием файла"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 201 Created и содержать информацию о загруженном файле.",
      solution: {
          url: "/api/upload",
          method: "POST",
          headers: {
              "Content-Type": "multipart/form-data"
          },
          formData: {
              file: "file_data",
              description: true
          }
      }
  },
  {
      id: 9,
      title: "Обработка ошибок API",
      subtitle: "Работа с ошибками и статус-кодами",
      description: "Изучите, как правильно обрабатывать ошибки API и интерпретировать различные статус-коды HTTP.",
      category: "basics",
      difficulty: "medium",
      status: "not_started",
      tags: ["Ошибки", "Статус-коды"],
      requirements: [
          "Создать несколько запросов с различными ошибками:",
          "1. GET запрос к несуществующему ресурсу /api/non-existent",
          "2. POST запрос без обязательных полей к /api/users",
          "3. GET запрос к /api/secure-data без API ключа"
      ],
      expectedResult: "Получение и анализ различных статус-кодов ошибок: 404 Not Found, 400 Bad Request, 401 Unauthorized.",
      solution: {
          steps: [
              {
                  url: "/api/non-existent",
                  method: "GET",
                  expectedStatus: 404
              },
              {
                  url: "/api/users",
                  method: "POST",
                  headers: {"Content-Type": "application/json"},
                  body: {},
                  expectedStatus: 400
              },
              {
                  url: "/api/secure-data",
                  method: "GET",
                  expectedStatus: 401
              }
          ]
      }
  },
  {
      id: 10,
      title: "GraphQL запросы",
      subtitle: "Альтернативные методы работы с API",
      description: "Познакомьтесь с GraphQL - современной альтернативой REST API, позволяющей клиентам запрашивать именно те данные, которые им нужны.",
      category: "advanced",
      difficulty: "hard",
      status: "locked",
      tags: ["GraphQL", "POST", "Query"],
      requirements: [
          "Использовать метод POST",
          "URL эндпоинта: /api/graphql",
          "Content-Type: application/json",
          "Тело запроса должно содержать GraphQL запрос:",
          "{",
          "  \"query\": \"{",
          "    user(id: 42) {",
          "      id",
          "      name",
          "      email",
          "      posts {",
          "        title",
          "      }",
          "    }",
          "  }\"",
          "}"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать только запрошенные данные пользователя и его постов.",
      solution: {
          url: "/api/graphql",
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: {
              query: "{ user(id: 42) { id name email posts { title } } }"
          }
      }
  }
];

// Прогресс выполнения курса и заданий
const userProgress = {
  // Общий прогресс курса (процент выполненных заданий)
  courseProgress: 35,
  
  // Статусы прохождения заданий
  taskStatuses: {
      1: "not_started",  // not_started, in_progress, completed, locked
      2: "not_started",
      3: "completed",
      4: "in_progress",
      5: "not_started",
      6: "not_started",
      7: "locked",
      8: "not_started",
      9: "not_started",
      10: "locked"
  },
  
  // Прогресс выполнения конкретных заданий (в процентах)
  taskProgress: {
      1: 0,
      2: 0,
      3: 100,
      4: 50,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0
  }
};

// Предустановленные решения для заданий (сохраненный прогресс)
const savedSolutions = {
  3: {  // ID задания
      url: "/api/users?role=admin&limit=10",
      method: "GET",
      headers: {},
      body: ""
  },
  4: {  // ID задания
      url: "/api/secure-data",
      method: "GET",
      headers: {
          "X-API-Key": "wrong_api_key"  // Неправильный ключ - задание в процессе
      },
      body: ""
  }
};

// Эмуляция ответов API для различных запросов
const apiResponses = {
  // GET /api/users
  "GET:/api/users": {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator",
          "Cache-Control": "no-cache"
      },
      body: [
          {
              id: 1,
              name: "Иван Петров",
              email: "ivan@example.com",
              role: "admin"
          },
          {
              id: 2,
              name: "Мария Сидорова",
              email: "maria@example.com",
              role: "user"
          },
          {
              id: 3,
              name: "Алексей Иванов",
              email: "alex@example.com",
              role: "user"
          }
      ]
  },
  
  // GET /api/users?role=admin&limit=10
  "GET:/api/users?role=admin&limit=10": {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator",
          "Cache-Control": "no-cache"
      },
      body: [
          {
              id: 1,
              name: "Иван Петров",
              email: "ivan@example.com",
              role: "admin"
          }
      ]
  },
  
  // POST /api/users (с правильными данными)
  "POST:/api/users": {
      status: 201,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator",
          "Location": "/api/users/4"
      },
      body: {
          id: 4,
          name: "{name}",  // Будет заменено на данные из запроса
          email: "{email}",  // Будет заменено на данные из запроса
          role: "{role}",  // Будет заменено на данные из запроса
          createdAt: "{currentDate}"  // Будет заменено на текущую дату/время
      }
  },
  
  // GET /api/secure-data (с правильным API ключом)
  "GET:/api/secure-data/your_api_key_123": {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator"
      },
      body: {
          message: "Вы успешно получили доступ к защищенным данным",
          secretData: "Очень секретная информация",
          timestamp: "{currentDate}"
      }
  },
  
  // GET /api/secure-data (с неправильным API ключом)
  "GET:/api/secure-data/wrong_api_key": {
      status: 401,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator"
      },
      body: {
          error: "Unauthorized",
          message: "Неверный API ключ"
      }
  },
  
  // PUT /api/users/42 (с правильными данными)
  "PUT:/api/users/42": {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator"
      },
      body: {
          id: 42,
          name: "{name}",  // Будет заменено на данные из запроса
          email: "{email}",  // Будет заменено на данные из запроса
          role: "{role}",  // Будет заменено на данные из запроса
          updatedAt: "{currentDate}"  // Будет заменено на текущую дату/время
      }
  },
  
  // DELETE /api/users/42
  "DELETE:/api/users/42": {
      status: 204,
      headers: {
          "Server": "API Simulator"
      },
      body: null
  },
  
  // Ошибки для задания 9
  "GET:/api/non-existent": {
      status: 404,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator"
      },
      body: {
          error: "Not Found",
          message: "Запрашиваемый ресурс не найден"
      }
  },
  
  // Специальный случай для задания 9 - ошибка валидации
  "POST:/api/users/empty": {
      status: 400,
      headers: {
          "Content-Type": "application/json",
          "Server": "API Simulator"
      },
      body: {
          error: "Bad Request",
          message: "Отсутствуют обязательные поля",
          details: {
              name: "Поле name обязательно",
              email: "Поле email обязательно",
              role: "Поле role обязательно"
          }
      }
  }
};

// Функция для получения текста сложности
function getDifficultyText(difficulty) {
  switch (difficulty) {
      case 'easy': return 'Начальный';
      case 'medium': return 'Средний';
      case 'hard': return 'Продвинутый';
      default: return 'Неизвестно';
  }
}

// Функция для получения текста категории
function getCategoryText(category) {
  switch (category) {
      case 'basics': return 'Основы API';
      case 'http': return 'Методы HTTP';
      case 'auth': return 'Аутентификация';
      case 'advanced': return 'Продвинутые техники';
      case 'testing': return 'Тестирование';
      default: return 'Прочее';
  }
}

// Функция для получения текста статуса
function getStatusText(status) {
  switch (status) {
      case 'not_started': return 'Не начато';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Завершено';
      case 'locked': return 'Заблокировано';
      default: return 'Неизвестно';
  }
}

// Функция для получения класса статуса
function getStatusClass(status) {
  switch (status) {
      case 'not_started': return 'status-not-started';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'locked': return 'status-locked';
      default: return '';
  }
}

// Добавляем новые задания, демонстрирующие работу с разными источниками API
const additionalTasks = [
    {
        id: 11,
        title: "Работа с публичными API",
        subtitle: "Использование реальных внешних API",
        description: "Изучите, как работать с публичными API на примере запросов к популярному сервису JSONPlaceholder.",
        category: "advanced",
        difficulty: "medium",
        status: "not_started",
        tags: ["GET", "Публичные API", "REST"],
        apiSourceRestrictions: ["public"], // Требуется публичный API
        recommendedApiSource: {
            name: "JSONPlaceholder API",
            description: "Бесплатный публичный API для тестирования и прототипирования"
        },
        requirements: [
            "Использовать метод GET",
            "URL эндпоинта: /posts",
            "Настроить заголовок Accept: application/json",
            "Отправить запрос к публичному API JSONPlaceholder"
        ],
        expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать массив постов в формате JSON.",
        requiresServerResponse: true, // Требуется проверка ответа сервера
        expectedResponse: {
            status: 200,
            body: {
                "length": true, // Проверяем, что в ответе есть массив с элементами
                "[0].id": true, // Проверяем наличие поля id в первом элементе
                "[0].title": true // Проверяем наличие поля title в первом элементе
            }
        },
        solution: {
            url: "/posts",
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            body: null
        },
        hints: [
            "Публичные API позволяют практиковаться с реальными данными без необходимости создавать собственный бэкенд.",
            "JSONPlaceholder предоставляет тестовые эндпоинты для имитации реальных API, которые вы можете встретить в работе.",
            "Для этого задания убедитесь, что выбран источник 'Публичные API' в селекторе источников API."
        ]
    },
    {
        id: 12,
        title: "Создание пользователя в учебном API",
        subtitle: "Работа с защищенными API",
        description: "Научитесь создавать ресурсы и работать с API, требующими аутентификации.",
        category: "auth",
        difficulty: "hard",
        status: "not_started",
        tags: ["POST", "Аутентификация", "REST"],
        apiSourceRestrictions: ["custom"], // Требуется собственный API
        requirements: [
            "Использовать метод POST",
            "URL эндпоинта: /api/protected/users",
            "Настроить заголовок Content-Type: application/json",
            "Настроить заголовок X-API-Quest-Auth с вашим токеном",
            "Сформировать тело запроса с полями name, email и role"
        ],
        expectedResult: "Успешный ответ будет иметь статус-код 201 Created и содержать данные созданного пользователя.",
        requiresServerResponse: true,
        expectedResponse: {
            status: 201,
            body: {
                "id": true,
                "name": true,
                "email": true,
                "role": true,
                "createdAt": true
            }
        },
        solution: {
            url: "/api/protected/users",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Quest-Auth": true
            },
            body: {
                name: true,
                email: true,
                role: true
            }
        },
        hints: [
            "Для работы с защищенным API необходимо пройти аутентификацию и получить токен.",
            "В учебном API платформы токен автоматически предоставляется авторизованным пользователям.",
            "Для этого задания необходимо использовать источник 'Учебный API' в селекторе источников."
        ]
    },
    {
        id: 13,
        title: "Сравнение ответов разных API-источников",
        subtitle: "Анализ различий в API",
        description: "Изучите, как одинаковые запросы могут давать разные результаты в зависимости от источника API. Сравните ответы моков, публичных API и учебного API.",
        category: "advanced",
        difficulty: "medium",
        status: "not_started",
        tags: ["GET", "Сравнение", "Анализ"],
        apiSourceRestrictions: [], // Любой источник API
        requirements: [
            "Использовать метод GET",
            "URL эндпоинта: /users",
            "Отправить запрос ко всем трем источникам API",
            "Сравнить полученные ответы и заполнить таблицу сравнения"
        ],
        expectedResult: "Успешное сравнение ответов от разных источников API с анализом различий в формате, содержании и структуре данных.",
        solution: {
            url: "/users",
            method: "GET",
            headers: {},
            body: null,
            compareTable: true // Признак того, что задание требует заполнения таблицы сравнения
        },
        hints: [
            "Разные API могут использовать разные форматы данных и конвенции именования полей.",
            "Обратите внимание на структуру ответов, наличие вложенных объектов и формат полей даты/времени.",
            "Для полного сравнения переключайтесь между источниками API с помощью селектора."
        ]
    }
  ];
  
  // Добавляем новые задания в общий массив
  tasks.push(...additionalTasks);
  
  // Обновляем базовые URL для разных API источников
  const apiSourceConfig = {
      mock: {
          name: "Симулятор API",
          description: "Локальные моки для обучения без внешних зависимостей",
          baseUrl: "" // Пустой URL для моков
      },
      public: {
          name: "Публичные API",
          description: "Набор бесплатных публичных API для практики",
          baseUrl: "https://jsonplaceholder.typicode.com" // JSONPlaceholder API
      },
      custom: {
          name: "Учебный API",
          description: "Собственный API платформы с расширенными возможностями",
          baseUrl: "https://api-quest.example.com/api"
      }
  };
  
  // Добавляем моки для новых ответов API
  const additionalApiResponses = {
      // Мок для публичного API с постами
      "GET:/posts": {
          status: 200,
          statusText: "OK",
          headers: {
              "Content-Type": "application/json",
              "Server": "API Simulator",
              "Cache-Control": "no-cache"
          },
          body: [
              {
                  userId: 1,
                  id: 1,
                  title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                  body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              },
              {
                  userId: 1,
                  id: 2,
                  title: "qui est esse",
                  body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
              },
              {
                  userId: 1,
                  id: 3,
                  title: "ea molestias quasi exercitationem repellat qui ipsa sit aut",
                  body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut"
              }
          ]
      },
      
      // Мок для сравнения API с разными источниками
      "GET:/users": {
          status: 200,
          statusText: "OK",
          headers: {
              "Content-Type": "application/json",
              "Server": "API Simulator",
              "Cache-Control": "no-cache"
          },
          body: [
              {
                  id: 1,
                  name: "Иван Петров",
                  email: "ivan@example.com",
                  role: "admin",
                  registeredAt: "2023-01-15T10:30:00Z"
              },
              {
                  id: 2,
                  name: "Мария Сидорова",
                  email: "maria@example.com",
                  role: "user",
                  registeredAt: "2023-02-20T14:15:00Z"
              },
              {
                  id: 3,
                  name: "Алексей Иванов",
                  email: "alex@example.com",
                  role: "user",
                  registeredAt: "2023-03-05T09:45:00Z"
              }
          ]
      },
      
      // Мок для создания пользователя в защищенном API
      "POST:/api/protected/users": {
          status: 201,
          statusText: "Created",
          headers: {
              "Content-Type": "application/json",
              "Server": "API Simulator",
              "Location": "/api/protected/users/4"
          },
          body: {
              id: 4,
              name: "{name}",
              email: "{email}",
              role: "{role}",
              createdAt: "{currentDate}"
          }
      }
  };
  
  // Добавляем новые моки в общий объект ответов
  Object.assign(apiResponses, additionalApiResponses);
  
  // Экспортируем конфигурацию API источников в глобальную область
  window.apiSourceConfig = apiSourceConfig;
