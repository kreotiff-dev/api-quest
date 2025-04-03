const Progress = require('../models/Progress');
const User = require('../models/User');
const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Получение прогресса текущего пользователя
 * @route   GET /api/progress
 * @access  Private
 */
exports.getMyProgress = asyncHandler(async (req, res, next) => {
  const progress = await Progress.findOne({ user: req.user.id })
    .populate([
      { path: 'user', select: 'name email' },
      { 
        path: 'courseProgress.course', 
        select: 'name code description' 
      },
      { 
        path: 'courseProgress.moduleProgress.module', 
        select: 'title description order' 
      },
      { 
        path: 'courseProgress.moduleProgress.taskProgress.task', 
        select: 'title description order type difficulty' 
      }
    ]);

  if (!progress) {
    return next(new ErrorResponse('Прогресс не найден', 404));
  }

  res.status(200).json({
    success: true,
    data: progress
  });
});

/**
 * @desc    Обновление прогресса для определенного задания
 * @route   POST /api/progress/tasks/:taskId
 * @access  Private
 */
exports.updateTaskProgress = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId).populate('module');

  if (!task) {
    return next(new ErrorResponse(`Задание с ID ${req.params.taskId} не найдено`, 404));
  }

  // Проверяем, что задание активно для обычных пользователей
  if (req.user.role === 'user' && !task.isActive) {
    return next(new ErrorResponse(`Доступ запрещён`, 403));
  }

  // Обновляем прогресс
  const { isCompleted = false, solution = {} } = req.body;

  const progress = await Progress.updateTaskCompletion(
    req.user.id,
    task.module.course,
    task.module._id,
    task._id,
    isCompleted
  );

  // Добавляем решение к прогрессу если предоставлено
  if (Object.keys(solution).length > 0) {
    // Найдем нужный прогресс задания
    const courseProgress = progress.courseProgress.find(cp => 
      cp.course.toString() === task.module.course.toString()
    );
    
    if (courseProgress) {
      const moduleProgress = courseProgress.moduleProgress.find(mp => 
        mp.module.toString() === task.module._id.toString()
      );
      
      if (moduleProgress) {
        const taskProgress = moduleProgress.taskProgress.find(tp => 
          tp.task.toString() === task._id.toString()
        );
        
        if (taskProgress) {
          taskProgress.solutions.push({
            ...solution,
            timestamp: Date.now(),
            isCorrect: isCompleted
          });
          
          await progress.save();
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    data: progress
  });
});

/**
 * @desc    Получение прогресса указанного пользователя (для админов/инструкторов)
 * @route   GET /api/progress/users/:userId
 * @access  Private (admin, instructor)
 */
exports.getUserProgress = asyncHandler(async (req, res, next) => {
  // Проверяем, существует ли пользователь
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    return next(new ErrorResponse(`Пользователь с ID ${req.params.userId} не найден`, 404));
  }

  const progress = await Progress.findOne({ user: req.params.userId })
    .populate([
      { path: 'user', select: 'name email' },
      { 
        path: 'courseProgress.course', 
        select: 'name code description' 
      },
      { 
        path: 'courseProgress.moduleProgress.module', 
        select: 'title description order' 
      },
      { 
        path: 'courseProgress.moduleProgress.taskProgress.task', 
        select: 'title description order type difficulty' 
      }
    ]);

  if (!progress) {
    return next(new ErrorResponse(`Прогресс для пользователя с ID ${req.params.userId} не найден`, 404));
  }

  res.status(200).json({
    success: true,
    data: progress
  });
});