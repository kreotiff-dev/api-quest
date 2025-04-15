const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * @desc    Получить данные для дашборда пользователя
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Получаем прогресс пользователя
  const userProgress = await Progress.findOne({ user: userId });
  
  // Готовим объект данных для дашборда
  const dashboardData = {
    stats: {
      completedTasks: 0,
      completedModules: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      overallProgress: 0
    },
    activeTasks: [],
    activeCourses: []
  };

  // Если прогресса нет, возвращаем пустые данные
  if (!userProgress) {
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  }

  // Подсчитываем статистику
  let completedTasks = 0;
  let completedModules = 0;
  let completedCourses = 0;
  let inProgressCourses = 0;
  let totalCourseProgress = 0;
  let courseCount = 0;

  const activeCourseIds = [];
  const activeModuleIds = [];
  const activeTaskIds = [];

  // Обрабатываем прогресс курсов
  for (const courseProgress of userProgress.courseProgress) {
    courseCount++;
    const courseCompleted = courseProgress.completed;
    totalCourseProgress += courseProgress.completionPercentage || 0;
    
    if (courseCompleted) {
      completedCourses++;
    } else if (courseProgress.started) {
      inProgressCourses++;
      activeCourseIds.push(courseProgress.course);
    }

    // Обрабатываем прогресс модулей
    for (const moduleProgress of courseProgress.moduleProgress) {
      if (moduleProgress.completed) {
        completedModules++;
      } else if (moduleProgress.started) {
        activeModuleIds.push(moduleProgress.module);
      }

      // Обрабатываем прогресс заданий
      for (const taskProgress of moduleProgress.taskProgress) {
        if (taskProgress.completed) {
          completedTasks++;
        } else if (taskProgress.started) {
          activeTaskIds.push(taskProgress.task);
        }
      }
    }
  }

  // Вычисляем общий прогресс
  const overallProgress = courseCount > 0 
    ? Math.round(totalCourseProgress / courseCount) 
    : 0;

  // Получаем данные активных курсов
  const activeCourses = await Course.find({
    _id: { $in: activeCourseIds }
  })
  .select('title description image difficulty duration')
  .limit(3);

  // Получаем данные активных заданий
  const activeTasks = await Task.find({
    _id: { $in: activeTaskIds }
  })
  .populate('module', 'title')
  .select('title description difficulty type module order')
  .limit(5)
  .sort({ updatedAt: -1 });

  // Получаем рекомендуемые задания, если активных мало
  let recommendedTasks = [];
  if (activeTasks.length < 3) {
    // Сначала ищем задания из активных модулей
    recommendedTasks = await Task.find({
      module: { $in: activeModuleIds },
      _id: { $nin: [...activeTaskIds, ...activeTasks.map(t => t._id)] }
    })
    .populate('module', 'title')
    .select('title description difficulty type module order')
    .limit(5 - activeTasks.length)
    .sort({ order: 1 });

    // Если всё еще не хватает, добавляем случайные задания из первых модулей первых курсов
    if (recommendedTasks.length + activeTasks.length < 3) {
      const firstModules = await Module.find()
        .sort({ order: 1 })
        .limit(3)
        .select('_id');
      
      const moduleIds = firstModules.map(m => m._id);
      
      const additionalTasks = await Task.find({
        module: { $in: moduleIds },
        _id: { $nin: [...activeTaskIds, ...activeTasks.map(t => t._id), ...recommendedTasks.map(t => t._id)] }
      })
      .populate('module', 'title')
      .select('title description difficulty type module order')
      .limit(3 - activeTasks.length - recommendedTasks.length)
      .sort({ order: 1 });
      
      recommendedTasks = [...recommendedTasks, ...additionalTasks];
    }
  }

  // Формируем итоговые данные
  dashboardData.stats = {
    completedTasks,
    completedModules,
    completedCourses,
    inProgressCourses,
    overallProgress
  };
  
  dashboardData.activeTasks = [
    ...activeTasks.map(task => ({
      ...task.toObject(),
      isActive: true
    })),
    ...recommendedTasks.map(task => ({
      ...task.toObject(),
      isRecommended: true
    }))
  ];
  
  dashboardData.activeCourses = activeCourses;

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});