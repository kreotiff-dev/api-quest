# API Документация тестового сервера

Эта документация описывает API тестового сервера, который используется для выполнения учебных заданий.

## Базовый URL

Все эндпоинты доступны по базовому URL: `http://api.example.com`

## Аутентификация

Для доступа к некоторым эндпоинтам требуется JWT токен. Для получения токена используйте эндпоинт `/api/auth/login`.

Токен необходимо передавать в заголовке `Authorization` в формате `Bearer <token>`.

## Ресурсы

### Пользователи

#### Получение списка пользователей

```
GET /api/users
```

Возвращает список всех пользователей.

**Параметры запроса:**
- `limit` - максимальное количество записей (по умолчанию 10)
- `page` - номер страницы (по умолчанию 1)

**Заголовки ответа:**
- `Content-Type: application/json`
- `X-Total-Count: <количество записей>`

**Ответ (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    }
  ]
}
```

#### Получение пользователя по ID

```
GET /api/users/{id}
```

Возвращает информацию о пользователе с указанным ID.

**Параметры пути:**
- `id` - ID пользователя (обязательный)

**Заголовки ответа:**
- `Content-Type: application/json`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Ответ (404 Not Found):**
```json
{
  "error": "Пользователь не найден"
}
```

#### Создание пользователя

```
POST /api/users
```

Создает нового пользователя.

**Заголовки запроса:**
- `Content-Type: application/json`

**Тело запроса:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**Обязательные поля:**
- `name` - имя пользователя
- `email` - email пользователя (должен быть уникальным)
- `password` - пароль (минимум 6 символов)

**Необязательные поля:**
- `role` - роль пользователя (по умолчанию "user")

**Заголовки ответа:**
- `Content-Type: application/json`
- `Location: /api/users/{id}`

**Ответ (201 Created):**
```json
{
  "id": 3,
  "name": "New User",
  "email": "newuser@example.com",
  "role": "user"
}
```

**Ответ (400 Bad Request):**
```json
{
  "error": "Неверный формат данных",
  "details": ["Email должен быть валидным", "Пароль должен содержать минимум 6 символов"]
}
```

#### Обновление пользователя

```
PUT /api/users/{id}
```

Обновляет данные пользователя с указанным ID.

**Параметры пути:**
- `id` - ID пользователя (обязательный)

**Заголовки запроса:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (обязательный)

**Тело запроса:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
```

**Заголовки ответа:**
- `Content-Type: application/json`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
```

**Ответ (404 Not Found):**
```json
{
  "error": "Пользователь не найден"
}
```

#### Удаление пользователя

```
DELETE /api/users/{id}
```

Удаляет пользователя с указанным ID.

**Параметры пути:**
- `id` - ID пользователя (обязательный)

**Заголовки запроса:**
- `Authorization: Bearer <token>` (обязательный)

**Ответ (204 No Content):**
Пустой ответ

### Продукты

#### Получение списка продуктов

```
GET /api/products
```

Возвращает список всех продуктов.

**Параметры запроса:**
- `category` - фильтр по категории (необязательный)
- `limit` - максимальное количество записей (по умолчанию 10)
- `page` - номер страницы (по умолчанию 1)

**Заголовки ответа:**
- `Content-Type: application/json`
- `X-Total-Count: <количество записей>`

**Ответ (200 OK):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "price": 19.99,
      "category": "electronics",
      "inStock": true
    },
    {
      "id": 2,
      "name": "Product B",
      "price": 29.99,
      "category": "clothing",
      "inStock": false
    }
  ]
}
```

#### Получение продукта по ID

```
GET /api/products/{id}
```

Возвращает информацию о продукте с указанным ID.

**Параметры пути:**
- `id` - ID продукта (обязательный)

**Заголовки ответа:**
- `Content-Type: application/json`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "name": "Product A",
  "description": "Detailed product description",
  "price": 19.99,
  "category": "electronics",
  "inStock": true,
  "attributes": {
    "color": "black",
    "weight": "300g",
    "dimensions": "10x5x2 cm"
  }
}
```

#### Создание продукта

```
POST /api/products
```

Создает новый продукт.

**Заголовки запроса:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (обязательный)

**Тело запроса:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 39.99,
  "category": "electronics",
  "inStock": true,
  "attributes": {
    "color": "silver",
    "weight": "250g"
  }
}
```

**Обязательные поля:**
- `name` - название продукта
- `price` - цена продукта (число больше 0)
- `category` - категория продукта

**Заголовки ответа:**
- `Content-Type: application/json`
- `Location: /api/products/{id}`

**Ответ (201 Created):**
```json
{
  "id": 3,
  "name": "New Product",
  "description": "Product description",
  "price": 39.99,
  "category": "electronics",
  "inStock": true,
  "attributes": {
    "color": "silver",
    "weight": "250g"
  }
}
```

### Аутентификация

#### Вход в систему

```
POST /api/auth/login
```

Аутентифицирует пользователя и возвращает JWT токен.

**Заголовки запроса:**
- `Content-Type: application/json`

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Обязательные поля:**
- `email` - email пользователя
- `password` - пароль пользователя

**Заголовки ответа:**
- `Content-Type: application/json`

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

**Ответ (401 Unauthorized):**
```json
{
  "error": "Неверные учетные данные"
}
```

### Заказы

#### Создание заказа

```
POST /api/orders
```

Создает новый заказ.

**Заголовки запроса:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (обязательный)

**Тело запроса:**
```json
{
  "products": [
    {
      "id": 1,
      "quantity": 2
    },
    {
      "id": 3,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

**Обязательные поля:**
- `products` - массив продуктов в заказе
- `shippingAddress` - адрес доставки
- `paymentMethod` - метод оплаты

**Заголовки ответа:**
- `Content-Type: application/json`
- `Location: /api/orders/{id}`

**Ответ (201 Created):**
```json
{
  "id": "ORD-12345",
  "date": "2024-04-15T10:30:00Z",
  "status": "pending",
  "total": 79.97,
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "price": 19.99,
      "quantity": 2
    },
    {
      "id": 3,
      "name": "Product C",
      "price": 39.99,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

## Коды статусов

- `200 OK` - Запрос выполнен успешно
- `201 Created` - Ресурс успешно создан
- `204 No Content` - Запрос выполнен успешно, в ответе нет содержимого
- `400 Bad Request` - Ошибка в запросе
- `401 Unauthorized` - Требуется аутентификация
- `403 Forbidden` - Нет доступа к ресурсу
- `404 Not Found` - Ресурс не найден
- `405 Method Not Allowed` - Метод не разрешен для данного ресурса
- `500 Internal Server Error` - Внутренняя ошибка сервера