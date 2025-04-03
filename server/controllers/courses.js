const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Получение всех курсов
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = asyncHandler(async (req, res, next) => {
  // Для обычных пользователей отображаем только активные курсы
  let query = {};
  
  if (req.user.role === 'user') {
    query.isActive = true;
  }

  // Опции для populate
  const populateOptions = [
    { path: 'createdBy', select: 'name' },
  ];

  const courses = await Course.find(query)
    .populate(populateOptions);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});

/**
 * @desc    Получение одного курса
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = asyncHandler(async (req, res, next) => {
  // Опции для populate
  const populateOptions = [
    { path: 'createdBy', select: 'name' },
    { path: 'modules', options: { sort: { order: 1 } } }
  ];

  const course = await Course.findById(req.params.id).populate(populateOptions);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !course.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Создание нового курса
 * @route   POST /api/courses
 * @access  Private (admin, instructor)
 */
exports.createCourse = asyncHandler(async (req, res, next) => {
  // Добавляем ID пользователя-создателя
  req.body.createdBy = req.user.id;
  req.body.updatedBy = req.user.id;

  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Обновление курса
 * @route   PUT /api/courses/:id
 * @access  Private (admin, instructor)
 */
exports.updateCourse = asyncHandler(async (req, res, next) => {
  // Добавляем ID пользователя, последним обновившего курс
  req.body.updatedBy = req.user.id;
  req.body.updatedAt = Date.now();

  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  // Проверка прав на обновление курса
  if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
    return next(new ErrorResponse(`Пользователь ${req.user.id} не имеет прав на обновление этого курса`, 403));
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Удаление курса
 * @route   DELETE /api/courses/:id
 * @access  Private (admin)
 */
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Получение модулей для курса
 * @route   GET /api/courses/:id/modules
 * @access  Private
 */
exports.getCourseModules = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !course.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  const modules = await course.populate({
    path: 'modules', 
    options: { sort: { order: 1 } },
    match: req.user.role === 'user' ? { isActive: true } : {}
  });

  res.status(200).json({
    success: true,
    count: modules.modules.length,
    data: modules.modules
  });
});

/**
 * @desc    Подписка на курс
 * @route   POST /api/courses/:id/enroll
 * @access  Private
 */
exports.enrollInCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  // Проверка доступа для обычных пользователей
  if (req.user.role === 'user' && !course.isActive) {
    return next(new ErrorResponse(`Курс недоступен`, 403));
  }

  // Проверка доступности курса для пользователя
  const isAvailable = await course.isAvailableForUser(req.user.id);
  if (!isAvailable) {
    return next(new ErrorResponse(`Вы не можете подписаться на этот курс. Необходимо выполнить предварительные требования.`, 403));
  }

  // Получаем пользователя и подписываем на курс
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  const progress = await user.enrollInCourse(course._id);

  res.status(200).json({
    success: true,
    message: `Вы успешно подписались на курс "${course.name}"`,
    data: {
      courseId: course._id,
      courseName: course.name,
      enrolledAt: new Date()
    }
  });
});

/**
 * @desc    Получение прогресса пользователя по курсу
 * @route   GET /api/courses/:id/progress
 * @access  Private
 */
exports.getCourseProgress = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Курс с ID ${req.params.id} не найден`, 404));
  }

  // Получаем прогресс пользователя по курсу
  const courseProgress = await course.getUserProgress(req.user.id);

  if (!courseProgress) {
    return res.status(200).json({
      success: true,
      data: {
        enrolled: false,
        message: 'Вы не подписаны на этот курс'
      }
    });
  }

  // Получаем информацию о модулях
  const Module = require('../models/Module');
  const modules = await Module.find({ course: course._id }).sort('order');
  
  // Обогащаем данные о прогрессе информацией о модулях
  const moduleData = modules.map(module => {
    const moduleProgress = courseProgress.moduleProgress.find(
      mp => mp.module.toString() === module._id.toString()
    );
    
    return {
      id: module._id,
      title: module.title,
      description: module.shortDescription || module.description,
      order: module.order,
      duration: module.duration,
      started: moduleProgress ? true : false,
      completed: moduleProgress && moduleProgress.completedAt ? true : false,
      completionPercentage: moduleProgress ? moduleProgress.completionPercentage : 0,
      startedAt: moduleProgress ? moduleProgress.startedAt : null,
      completedAt: moduleProgress ? moduleProgress.completedAt : null,
      isAvailable: !module.isLocked || (req.user.role !== 'user')
    };
  });

  res.status(200).json({
    success: true,
    data: {
      enrolled: true,
      startedAt: courseProgress.startedAt,
      completedAt: courseProgress.completedAt,
      completionPercentage: courseProgress.completionPercentage,
      modules: moduleData
    }
  });
});