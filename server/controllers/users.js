const User = require('../models/User');
const Progress = require('../models/Progress');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Получение всех пользователей
 * @route   GET /api/users
 * @access  Private (admin, instructor)
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * @desc    Получение одного пользователя
 * @route   GET /api/users/:id
 * @access  Private (admin, instructor)
 */
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password').populate('progress');
  
  if (!user) {
    return next(new ErrorResponse(`Пользователь с ID ${req.params.id} не найден`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Создание пользователя
 * @route   POST /api/users
 * @access  Private (admin)
 */
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  
  // Создаем запись прогресса для нового пользователя
  await Progress.create({
    user: user._id,
    courseProgress: []
  });
  
  res.status(201).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Обновление пользователя
 * @route   PUT /api/users/:id
 * @access  Private (admin)
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`Пользователь с ID ${req.params.id} не найден`, 404));
  }
  
  // Не позволяем обновить пароль через этот маршрут
  if (req.body.password) {
    delete req.body.password;
  }
  
  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Удаление пользователя
 * @route   DELETE /api/users/:id
 * @access  Private (admin)
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`Пользователь с ID ${req.params.id} не найден`, 404));
  }
  
  // Удаляем пользователя
  await user.deleteOne();
  
  // Удаляем прогресс пользователя
  await Progress.findOneAndDelete({ user: req.params.id });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});