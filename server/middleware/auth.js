const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware для защиты маршрутов
 * Проверяет наличие и валидность JWT токена
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Получаем токен из заголовков или cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Получаем токен из заголовка Authorization
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Получаем токен из cookies
    token = req.cookies.token;
  }

  // Проверяем наличие токена
  if (!token) {
    return next(new ErrorResponse('Не авторизован', 401));
  }

  try {
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Получаем пользователя по ID из токена
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse('Пользователь не найден', 404));
    }

    next();
  } catch (err) {
    logger.error(`Ошибка авторизации: ${err.message}`);
    return next(new ErrorResponse('Не авторизован', 401));
  }
});

/**
 * Middleware для проверки ролей
 * @param {...string} roles - Разрешенные роли
 * @returns {Function} Middleware-функция для Express
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Необходима авторизация', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`Роль ${req.user.role} не имеет доступа к этому ресурсу`, 403)
      );
    }
    next();
  };
};