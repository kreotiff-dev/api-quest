const Task = require('../models/Task');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Получение всех заданий
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = asyncHandler(async (req, res, next) => {
  let query = {};
  
  // Добавляем возможность фильтрации по модулю
  if (req.query.module) {
    query.module = req.query.module;
  }
  
  // Проверка активности для обычных пользователей
  if (req.user.role === 'user') {
    query.isActive = true;
  }

  // Опции для populate
  const populateOptions = [
    { path: 'module', select: 'title course order' },
    { path: 'createdBy', select: 'name' }
  ];

  const tasks = await Task.find(query)
    .populate(populateOptions)
    .sort({ 'module.order': 1, order: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

/**
 * @desc    Получение одного задания
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = asyncHandler(async (req, res, next) => {
  const populateOptions = [
    { path: 'module', select: 'title course order' },
    { path: 'createdBy', select: 'name' }
  ];

  const task = await Task.findById(req.params.id).populate(populateOptions);

  if (!task) {
    return next(new ErrorResponse(`Задание с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !task.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Создание нового задания
 * @route   POST /api/tasks
 * @access  Private (admin, instructor)
 */
exports.createTask = asyncHandler(async (req, res, next) => {
  // Проверяем существование модуля
  const module = await Module.findById(req.body.module);
  if (!module) {
    return next(new ErrorResponse(`Модуль с ID ${req.body.module} не найден`, 404));
  }

  // Добавляем ID пользователя-создателя
  req.body.createdBy = req.user.id;
  req.body.updatedBy = req.user.id;

  const task = await Task.create(req.body);

  res.status(201).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Обновление задания
 * @route   PUT /api/tasks/:id
 * @access  Private (admin, instructor)
 */
exports.updateTask = asyncHandler(async (req, res, next) => {
  // Добавляем ID пользователя, последним обновившего задание
  req.body.updatedBy = req.user.id;
  req.body.updatedAt = Date.now();

  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Задание с ID ${req.params.id} не найден`, 404));
  }

  // Проверка прав на обновление задания
  if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`Пользователь ${req.user.id} не имеет прав на обновление этого задания`, 403));
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Удаление задания
 * @route   DELETE /api/tasks/:id
 * @access  Private (admin)
 */
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Задание с ID ${req.params.id} не найден`, 404));
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Проверка решения задания
 * @route   POST /api/tasks/:id/check
 * @access  Private
 */
exports.checkTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Задание с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !task.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  // Получаем данные решения от пользователя
  const { method, url, headers, body } = req.body;

  // Здесь должна быть логика проверки решения
  // Для простоты примера, мы делаем простую проверку
  let isCorrect = false;
  let feedback = 'Решение неверно';

  if (task.solution.method === method && task.solution.url === url) {
    isCorrect = true;
    feedback = 'Решение верно';
  }

  // Сохраняем результат проверки в прогрессе пользователя
  await Progress.updateTaskCompletion(
    req.user.id,
    task.module.course,
    task.module._id,
    task._id,
    isCorrect
  );

  const solution = {
    timestamp: Date.now(),
    method,
    url,
    headers,
    body,
    isCorrect
  };

  res.status(200).json({
    success: true,
    data: {
      isCorrect,
      feedback,
      solution
    }
  });
});