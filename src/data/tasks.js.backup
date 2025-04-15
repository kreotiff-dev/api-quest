/**
 * Модуль данных заданий API-Quest
 * @module data/tasks
 */

/**
 * Массив заданий для обучения API
 * @type {Array<Object>}
 */
export const tasks = [
    {
        id: 1,
        title: "Базовый GET запрос",
        subtitle: "Основы HTTP запросов",
        description: "Научитесь создавать простые GET запросы для получения данных с сервера. Согласно документации API, эндпоинт /api/users должен возвращать список пользователей, каждый из которых содержит следующие поля: id, name, email и role. Дополнительные поля не документированы.",
        category: "basics",
        difficulty: "easy",
        verificationType: 'multiple-choice',
        status: "not_started",
        tags: ["GET", "Основы"],
        requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/users",
          "Не требуется дополнительных заголовков"
        ],
        expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать массив пользователей в формате JSON с полями id, name, email и role для каждого пользователя.",
        verification_answers: {
          beginnerAnswers: ['missing-fields', 'extra-field'],
          advancedAnswerKeywords: ['отсутствует возраст', 'age отсутствует', 'createdAt лишнее', 'createdAt не документировано']
        },
        verificationQuestion: "Какие несоответствия в структуре ответа есть исходя из документации API?",
        verificationOptions: [
            { value: 'missing-fields', label: 'Отсутствует поле age, которое должно быть согласно документации' },
            { value: 'empty-fields', label: 'Пустые значения полей name, email и role' },
            { value: 'wrong-status', label: 'Неверный статус-код ответа' },
            { value: 'extra-field', label: 'Лишнее поле createdAt, не указанное в документации' },
            { value: 'wrong-format', label: 'Неверный формат данных в полях' }
        ],
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
            "Тело запроса должно содержать GraphQL запрос"
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
    },
    {
        id: 11,
        title: "Работа с публичными API",
        subtitle: "Использование реальных внешних API",
        description: "Изучите, как работать с публичными API на примере запросов к популярному сервису JSONPlaceholder.",
        category: "advanced",
        difficulty: "medium",
        status: "not_started",
        tags: ["GET", "Публичные API", "REST"],
        apiSourceRestrictions: ["public"],
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
        requiresServerResponse: true,
        expectedResponse: {
            status: 200,
            body: {
                "length": true,
                "[0].id": true,
                "[0].title": true
            }
        },
        solution: {
            url: "/posts",
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            body: null
        }
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
        apiSourceRestrictions: ["custom"],
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
        }
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
        apiSourceRestrictions: [],
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
            compareTable: true
        }
    }
  ];
  
  /**
   * Получение задания по ID
   * @param {number} id - ID задания
   * @returns {Object|null} Задание или null, если не найдено
   */
  export function getTaskById(id) {
      return tasks.find(task => task.id === parseInt(id)) || null;
  }
  
  /**
   * Получение всех заданий
   * @returns {Array<Object>} Массив заданий
   */
  export function getAllTasks() {
      return [...tasks]; // Возвращаем копию массива
  }
  
  /**
   * Фильтрация заданий
   * @param {Object} filters - Объект с фильтрами
   * @param {string} [filters.category] - Категория задания
   * @param {string} [filters.difficulty] - Сложность задания
   * @param {string} [filters.status] - Статус задания
   * @param {string} [filters.search] - Поисковый запрос
   * @returns {Array<Object>} Отфильтрованные задания
   */
  export function filterTasks(filters) {
      return tasks.filter(task => {
          // Фильтр по категории
          if (filters.category && filters.category !== 'all' && task.category !== filters.category) {
              return false;
          }
          
          // Фильтр по сложности
          if (filters.difficulty && filters.difficulty !== 'all' && task.difficulty !== filters.difficulty) {
              return false;
          }
          
          // Фильтр по статусу
          if (filters.status && filters.status !== 'all' && task.status !== filters.status) {
              return false;
          }
          
          // Поиск по тексту
          if (filters.search) {
              const searchText = filters.search.toLowerCase();
              return (
                  task.title.toLowerCase().includes(searchText) ||
                  task.description.toLowerCase().includes(searchText) ||
                  task.tags.some(tag => tag.toLowerCase().includes(searchText))
              );
          }
          
          return true;
      });
  }
  
  /**
   * Получение текста сложности задания
   * @param {string} difficulty - Код сложности (easy, medium, hard)
   * @returns {string} Текстовое представление сложности
   */
  export function getDifficultyText(difficulty) {
      switch (difficulty) {
          case 'easy': return 'Начальный';
          case 'medium': return 'Средний';
          case 'hard': return 'Продвинутый';
          default: return 'Неизвестно';
      }
  }
  
  /**
   * Получение текста категории задания
   * @param {string} category - Код категории
   * @returns {string} Текстовое представление категории
   */
  export function getCategoryText(category) {
      switch (category) {
          case 'basics': return 'Основы API';
          case 'http': return 'Методы HTTP';
          case 'auth': return 'Аутентификация';
          case 'advanced': return 'Продвинутые техники';
          case 'testing': return 'Тестирование';
          default: return 'Прочее';
      }
  }
  
  /**
   * Получение текста статуса задания
   * @param {string} status - Код статуса
   * @returns {string} Текстовое представление статуса
   */
  export function getStatusText(status) {
      switch (status) {
          case 'not_started': return 'Не начато';
          case 'in_progress': return 'В процессе';
          case 'completed': return 'Завершено';
          case 'locked': return 'Заблокировано';
          default: return 'Неизвестно';
      }
  }
  
  /**
   * Получение класса статуса задания
   * @param {string} status - Код статуса
   * @returns {string} CSS-класс
   */
  export function getStatusClass(status) {
      switch (status) {
          case 'not_started': return 'status-not-started';
          case 'in_progress': return 'status-in-progress';
          case 'completed': return 'status-completed';
          case 'locked': return 'status-locked';
          default: return '';
      }
  }
  
  export default {
      tasks,
      getTaskById,
      getAllTasks,
      filterTasks,
      getDifficultyText,
      getCategoryText,
      getStatusText,
      getStatusClass
  };