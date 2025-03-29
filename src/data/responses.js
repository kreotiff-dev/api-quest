/**
 * Мок-ответы API для симулятора
 * @module data/responses
 */

// Эмуляция ответов API для различных запросов
export const apiResponses = {
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
                role: "admin",
                createdAt: "2024-03-15T10:30:00.000Z"
            },
            {
                id: 2,
                name: "Мария Сидорова",
                email: "maria@example.com",
                role: "user",
                createdAt: "2024-03-18T14:25:00.000Z"
            },
            {
                id: 3,
                name: "Алексей Иванов",
                email: "alex@example.com",
                createdAt: "2024-03-20T09:15:00.000Z",
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
    
    // GET /api/protected-resource (с токеном OAuth)
    "GET:/api/protected-resource/Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ": {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Server": "API Simulator"
        },
        body: {
            message: "Вы успешно получили доступ к защищенному ресурсу",
            protectedData: {
                id: 999,
                name: "Секретный проект",
                description: "Описание защищенного ресурса",
                accessLevel: "all"
            },
            timestamp: "{currentDate}"
        }
    },
    
    // POST /api/upload (с файлом)
    "POST:/api/upload": {
        status: 201,
        headers: {
            "Content-Type": "application/json",
            "Server": "API Simulator"
        },
        body: {
            message: "Файл успешно загружен",
            fileInfo: {
                id: "f123456",
                name: "{filename}",
                description: "{description}",
                size: 12345,
                mimeType: "image/jpeg",
                uploadedAt: "{currentDate}"
            }
        }
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
    },
    
    // GraphQL запрос
    "POST:/api/graphql": {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Server": "API Simulator"
        },
        body: {
            data: {
                user: {
                    id: 42,
                    name: "Дмитрий Александров",
                    email: "dmitry@example.com",
                    posts: [
                        {
                            title: "Введение в GraphQL"
                        },
                        {
                            title: "REST vs GraphQL: что выбрать?"
                        },
                        {
                            title: "Практика работы с GraphQL"
                        }
                    ]
                }
            }
        }
    },
    
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

export default apiResponses;