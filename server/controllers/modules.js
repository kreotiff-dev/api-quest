const Module = require('../models/Module');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Получение всех модулей
 * @route   GET /api/modules
 * @access  Private
 */
exports.getModules = asyncHandler(async (req, res, next) => {
  // Добавляем возможность фильтрации по курсу
  let query = {};
  
  if (req.query.course) {
    query.course = req.query.course;
  }
  
  // Проверка активности для обычных пользователей
  if (req.user.role === 'user') {
    query.isActive = true;
  }

  // Опции для populate
  const populateOptions = [
    { path: 'createdBy', select: 'name' },
    { path: 'course', select: 'name code' }
  ];

  const modules = await Module.find(query)
    .populate(populateOptions)
    .sort({ order: 1 });

  res.status(200).json({
    success: true,
    count: modules.length,
    data: modules
  });
});

/**
 * @desc    Получение одного модуля
 * @route   GET /api/modules/:id
 * @access  Private
 */
exports.getModule = asyncHandler(async (req, res, next) => {
  // Опции для populate
  const populateOptions = [
    { path: 'createdBy', select: 'name' },
    { path: 'course', select: 'name code' },
    { path: 'tasks', options: { sort: { order: 1 } } }
  ];

  const module = await Module.findById(req.params.id).populate(populateOptions);

  if (!module) {
    return next(new ErrorResponse(`Модуль с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !module.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  res.status(200).json({
    success: true,
    data: module
  });
});

/**
 * @desc    Создание нового модуля
 * @route   POST /api/modules
 * @access  Private (admin, instructor)
 */
exports.createModule = asyncHandler(async (req, res, next) => {
  // Добавляем ID пользователя-создателя
  req.body.createdBy = req.user.id;
  req.body.updatedBy = req.user.id;

  const module = await Module.create(req.body);

  res.status(201).json({
    success: true,
    data: module
  });
});

/**
 * @desc    Обновление модуля
 * @route   PUT /api/modules/:id
 * @access  Private (admin, instructor)
 */
exports.updateModule = asyncHandler(async (req, res, next) => {
  // Добавляем ID пользователя, последним обновившего модуль
  req.body.updatedBy = req.user.id;
  req.body.updatedAt = Date.now();

  let module = await Module.findById(req.params.id);

  if (!module) {
    return next(new ErrorResponse(`Модуль с ID ${req.params.id} не найден`, 404));
  }

  // Проверка прав на обновление модуля
  if (req.user.role !== 'admin' && module.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`Пользователь ${req.user.id} не имеет прав на обновление этого модуля`, 403));
  }

  module = await Module.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: module
  });
});

/**
 * @desc    Удаление модуля
 * @route   DELETE /api/modules/:id
 * @access  Private (admin)
 */
exports.deleteModule = asyncHandler(async (req, res, next) => {
  const module = await Module.findById(req.params.id);

  if (!module) {
    return next(new ErrorResponse(`Модуль с ID ${req.params.id} не найден`, 404));
  }

  await module.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Получение заданий для модуля
 * @route   GET /api/modules/:id/tasks
 * @access  Private
 */
exports.getModuleTasks = asyncHandler(async (req, res, next) => {
  const module = await Module.findById(req.params.id);

  if (!module) {
    return next(new ErrorResponse(`Модуль с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !module.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  const tasks = await module.populate({
    path: 'tasks', 
    options: { sort: { order: 1 } },
    match: req.user.role === 'user' ? { isActive: true } : {}
  });

  res.status(200).json({
    success: true,
    count: tasks.tasks.length,
    data: tasks.tasks
  });
});