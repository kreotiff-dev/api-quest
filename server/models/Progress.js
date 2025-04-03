const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Progress:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID записи прогресса
 *         user:
 *           type: string
 *           description: ID пользователя, которому принадлежит прогресс
 *         courseProgress:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               course:
 *                 type: string
 *                 description: ID курса
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Дата начала курса
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Дата завершения курса
 *               completionPercentage:
 *                 type: number
 *                 description: Процент выполнения курса
 *               moduleProgress:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                       description: ID модуля
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Дата начала модуля
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Дата завершения модуля
 *                     completionPercentage:
 *                       type: number
 *                       description: Процент выполнения модуля
 *                     taskProgress:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           task:
 *                             type: string
 *                             description: ID задания
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Дата начала задания
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Дата завершения задания
 *                           attempts:
 *                             type: number
 *                             description: Количество попыток
 *                           completed:
 *                             type: boolean
 *                             description: Выполнено ли задание
 *                           solutions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 timestamp:
 *                                   type: string
 *                                   format: date-time
 *                                   description: Временная метка решения
 *                                 method:
 *                                   type: string
 *                                   description: HTTP метод
 *                                 url:
 *                                   type: string
 *                                   description: URL
 *                                 headers:
 *                                   type: object
 *                                   description: Заголовки
 *                                 body:
 *                                   type: object
 *                                   description: Тело запроса
 *                                 response:
 *                                   type: object
 *                                   description: Ответ сервера
 *                                 isCorrect:
 *                                   type: boolean
 *                                   description: Корректно ли решение
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Дата последней активности пользователя
 *       example:
 *         _id: 60d0fe4f5311236168a109cf
 *         user: 60d0fe4f5311236168a109ca
 *         courseProgress:
 *           - course: 60d0fe4f5311236168a109cb
 *             startedAt: 2020-04-14T16:00:00.000Z
 *             completionPercentage: 25
 *             moduleProgress:
 *               - module: 60d0fe4f5311236168a109cd
 *                 startedAt: 2020-04-14T16:00:00.000Z
 *                 completionPercentage: 50
 *                 taskProgress:
 *                   - task: 60d0fe4f5311236168a109ce
 *                     startedAt: 2020-04-14T16:00:00.000Z
 *                     attempts: 2
 *                     completed: true
 *                     completedAt: 2020-04-14T17:00:00.000Z
 *         lastActivity: 2020-04-14T17:00:00.000Z
 */

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Необходимо указать пользователя'],
    unique: true
  },
  courseProgress: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Необходимо указать курс']
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    moduleProgress: [{
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: [true, 'Необходимо указать модуль']
      },
      startedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date,
      completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      taskProgress: [{
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
          required: [true, 'Необходимо указать задание']
        },
        startedAt: {
          type: Date,
          default: Date.now
        },
        completedAt: Date,
        attempts: {
          type: Number,
          default: 0
        },
        completed: {
          type: Boolean,
          default: false
        },
        solutions: [{
          timestamp: {
            type: Date,
            default: Date.now
          },
          method: String,
          url: String,
          headers: Object,
          body: Object,
          response: Object,
          isCorrect: Boolean
        }]
      }]
    }]
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware для обновления последней активности
ProgressSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// Статический метод для обновления прогресса по заданию
ProgressSchema.statics.updateTaskCompletion = async function(userId, courseId, moduleId, taskId, isCompleted) {
  const progress = await this.findOne({ user: userId });
  
  if (!progress) {
    throw new Error('Прогресс пользователя не найден');
  }

  // Найти курс в прогрессе
  let courseProgress = progress.courseProgress.find(cp => 
    cp.course.toString() === courseId.toString()
  );

  // Если курс не найден, создаем новый
  if (!courseProgress) {
    courseProgress = {
      course: courseId,
      startedAt: Date.now(),
      moduleProgress: []
    };
    progress.courseProgress.push(courseProgress);
  }

  // Найти модуль в прогрессе курса
  let moduleProgress = courseProgress.moduleProgress.find(mp => 
    mp.module.toString() === moduleId.toString()
  );

  // Если модуль не найден, создаем новый
  if (!moduleProgress) {
    moduleProgress = {
      module: moduleId,
      startedAt: Date.now(),
      taskProgress: []
    };
    courseProgress.moduleProgress.push(moduleProgress);
  }

  // Найти задание в прогрессе модуля
  let taskProgress = moduleProgress.taskProgress.find(tp => 
    tp.task.toString() === taskId.toString()
  );

  // Если задание не найдено, создаем новое
  if (!taskProgress) {
    taskProgress = {
      task: taskId,
      startedAt: Date.now(),
      attempts: 1,
      completed: isCompleted
    };
    moduleProgress.taskProgress.push(taskProgress);
  } else {
    // Обновляем существующее задание
    taskProgress.attempts += 1;
    if (isCompleted && !taskProgress.completed) {
      taskProgress.completed = true;
      taskProgress.completedAt = Date.now();
    }
  }

  // Обновляем процент выполнения модуля
  const completedTasks = moduleProgress.taskProgress.filter(tp => tp.completed).length;
  const totalTasks = moduleProgress.taskProgress.length;
  moduleProgress.completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  // Если все задания модуля выполнены, отмечаем модуль как завершенный
  if (moduleProgress.completionPercentage === 100 && !moduleProgress.completedAt) {
    moduleProgress.completedAt = Date.now();
  }

  // Обновляем процент выполнения курса
  const completedModules = courseProgress.moduleProgress.filter(mp => mp.completedAt).length;
  const totalModules = courseProgress.moduleProgress.length;
  courseProgress.completionPercentage = Math.round((completedModules / totalModules) * 100);

  // Если все модули курса выполнены, отмечаем курс как завершенный
  if (courseProgress.completionPercentage === 100 && !courseProgress.completedAt) {
    courseProgress.completedAt = Date.now();
  }

  await progress.save();
  return progress;
};

module.exports = mongoose.model('Progress', ProgressSchema);