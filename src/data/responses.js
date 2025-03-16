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
  
  // ... (здесь будут перенесены остальные мок-ответы)
  
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
  }
};