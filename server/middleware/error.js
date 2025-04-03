const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Middleware для обработки ошибок
 * @param {Error} err - Объект ошибки
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next middleware функция
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Логируем ошибку
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  // Ошибка Mongoose - неверный ObjectId
  if (err.name === 'CastError') {
    const message = `Ресурс с ID ${err.value} не найден`;
    error = new ErrorResponse(message, 404);
  }

  // Ошибка Mongoose - дубликат ключа
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Поле ${field} со значением ${value} уже существует`;
    error = new ErrorResponse(message, 400);
  }

  // Ошибка Mongoose - ошибки валидации
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Ошибка JWT - некорректный токен
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Некорректный токен. Пожалуйста, войдите снова', 401);
  }

  // Ошибка JWT - истекший токен
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Срок действия токена истек. Пожалуйста, войдите снова', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Ошибка сервера'
  });
};

module.exports = errorHandler;