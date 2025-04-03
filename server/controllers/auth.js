const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const logger = require('../utils/logger');
const Progress = require('../models/Progress');

/**
 * @desc    Регистрация пользователя
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Создаем пользователя
  const user = await User.create({
    name,
    email,
    password
  });

  // Создаем запись прогресса для нового пользователя
  await Progress.create({
    user: user._id,
    courseProgress: []
  });

  // Отправляем токен с ответом
  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Вход пользователя
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Проверяем наличие email и пароля
  if (!email || !password) {
    return next(new ErrorResponse('Необходимо указать email и пароль', 400));
  }

  // Проверяем существование пользователя
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Неверные учетные данные', 401));
  }

  // Проверяем правильность пароля
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    logger.warn(`Неудачная попытка входа для ${email}`);
    return next(new ErrorResponse('Неверные учетные данные', 401));
  }

  // Логируем успешный вход
  logger.info(`Пользователь ${email} успешно вошел в систему`);

  // Отправляем токен с ответом
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Выход пользователя / очистка cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 секунд
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Получение текущего пользователя
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  // Пользователь уже доступен в req.user через middleware auth
  const user = await User.findById(req.user.id).populate('progress');

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Обновление данных пользователя
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Обновление пароля
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Проверяем текущий пароль
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Неверный пароль', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * Функция для отправки ответа с JWT токеном
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Создаем токен
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Добавляем secure флаг в cookie, если окружение production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};