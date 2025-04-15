const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');

// Загрузка переменных среды
dotenv.config();

// Инициализация Express
const app = express();

// Подключение к базе данных
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Настраиваем CORS
app.use(cors());

app.use(helmet({ contentSecurityPolicy: false }));

// Логирование в режиме разработки
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Ограничение запросов для защиты от DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Слишком много запросов с этого IP, пожалуйста, попробуйте снова позже'
});

// Применяем ограничитель запросов к API-маршрутам аутентификации
app.use('/api/auth', limiter);

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Тестовый маршрут для проверки API и MongoDB
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API работает',
    mongoConnection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'Not set'
    }
  });
});

// Маршруты API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));

// Статические файлы для клиентской части
app.use(express.static(path.join(__dirname, '../')));

// Если маршрут не найден, отправляем клиентский роутер
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Middleware для обработки ошибок
app.use(errorHandler);

// Определяем порт
const PORT = process.env.PORT || 3000;

// Запуск сервера
const server = app.listen(PORT, () => {
  logger.info(`Сервер запущен в режиме ${process.env.NODE_ENV} на порту ${PORT}`);
});

// Обработка непредвиденных ошибок
process.on('unhandledRejection', (err) => {
  logger.error(`Необработанная ошибка: ${err.message}`);
  // Закрываем сервер и выходим из процесса
  server.close(() => process.exit(1));
});

module.exports = app;