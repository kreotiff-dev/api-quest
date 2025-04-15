const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - module
 *         - order
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID задания
 *         title:
 *           type: string
 *           description: Название задания
 *         description:
 *           type: string
 *           description: Описание задания
 *         module:
 *           type: string
 *           description: ID модуля, к которому относится задание
 *         order:
 *           type: number
 *           description: Порядковый номер задания в модуле
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Сложность задания
 *         type:
 *           type: string
 *           enum: [api, quiz, theory, project]
 *           description: Тип задания
 *         apiSourceRestrictions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [mock, public, custom]
 *           description: Ограничения на использование источников API для задания
 *         solution:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *               description: HTTP метод для решения
 *             url:
 *               type: string
 *               description: URL для решения
 *             headers:
 *               type: object
 *               description: Заголовки для решения
 *             body:
 *               type: object
 *               description: Тело запроса для решения
 *             steps:
 *               type: array
 *               description: Шаги для решения задания
 *         expectedResponse:
 *           type: object
 *           properties:
 *             status:
 *               type: number
 *               description: Ожидаемый статус ответа
 *             headers:
 *               type: object
 *               description: Ожидаемые заголовки ответа
 *             body:
 *               type: object
 *               description: Ожидаемое тело ответа
 *             exactMatch:
 *               type: boolean
 *               description: Требуется ли точное совпадение
 *         hints:
 *           type: array
 *           items:
 *             type: string
 *           description: Подсказки для задания
 *         isActive:
 *           type: boolean
 *           description: Активно ли задание
 *         requiresServerResponse:
 *           type: boolean
 *           description: Требуется ли ответ от сервера для проверки
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания задания
 *         createdBy:
 *           type: string
 *           description: ID пользователя, создавшего задание
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления задания
 *         updatedBy:
 *           type: string
 *           description: ID пользователя, последним обновившего задание
 *       example:
 *         _id: 60d0fe4f5311236168a109ce
 *         title: GET запрос к API
 *         description: Выполните GET запрос к указанному API эндпоинту
 *         module: 60d0fe4f5311236168a109cd
 *         order: 1
 *         difficulty: medium
 *         type: api
 *         apiSourceRestrictions: [mock, public]
 *         isActive: true
 *         createdAt: 2020-04-14T16:00:00.000Z
 *         createdBy: 60d0fe4f5311236168a109ca
 *         updatedAt: 2020-04-14T16:00:00.000Z
 */

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Необходимо указать название задания'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Необходимо указать описание задания']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Необходимо указать принадлежность к модулю']
  },
  order: {
    type: Number,
    required: [true, 'Необходимо указать порядковый номер задания в модуле']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['api', 'quiz', 'theory', 'project', 'exercise', 'challenge'],
    default: 'api'
  },
  duration: {
    type: Number, // в минутах
    default: 15
  },
  points: {
    type: Number, // очки за выполнение
    default: 10
  },
  tags: {
    type: [String]
  },
  apiSourceRestrictions: {
    type: [String],
    enum: ['mock', 'public', 'custom'],
    default: undefined
  },
  solution: {
    method: String,
    url: String,
    headers: Object,
    body: Object,
    steps: [Object]
  },
  expectedResponse: {
    status: Number,
    headers: Object,
    body: Object,
    exactMatch: Boolean
  },
  hints: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  requiresServerResponse: {
    type: Boolean,
    default: true
  },
  hintTimeThresholds: [{
    timeInMinutes: Number, // время в минутах, после которого станет доступна подсказка
    hintIndex: Number // индекс подсказки, которая станет доступна
  }],
  // Поля для верификации
  verificationType: {
    type: String,
    enum: ['multiple-choice', 'free-form'],
    default: 'multiple-choice'
  },
  verificationQuestion: {
    type: String,
    default: 'Какие проблемы или нарушения спецификации вы видите в ответе API?'
  },
  verificationOptions: [{
    value: String,
    label: String
  }],
  verification_answers: {
    beginnerAnswers: [String],
    advancedAnswerKeywords: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Необходимо указать создателя задания']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Индекс для быстрого поиска заданий по модулю и порядковому номеру
TaskSchema.index({ module: 1, order: 1 }, { unique: true });

// Автоматическое обновление даты изменения
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Метод для получения прогресса пользователя по заданию
TaskSchema.methods.getUserProgress = async function(userId, courseId, moduleId) {
  const Progress = mongoose.model('Progress');
  const userProgress = await Progress.findOne({ user: userId });
  
  if (!userProgress) {
    return null;
  }
  
  const courseProgress = userProgress.courseProgress.find(
    cp => cp.course.toString() === courseId.toString()
  );
  
  if (!courseProgress) {
    return null;
  }
  
  const moduleProgress = courseProgress.moduleProgress.find(
    mp => mp.module.toString() === moduleId.toString()
  );
  
  if (!moduleProgress) {
    return null;
  }
  
  const taskProgress = moduleProgress.taskProgress.find(
    tp => tp.task.toString() === this._id.toString()
  );
  
  return taskProgress || null;
};

// Метод для проверки доступности задания для пользователя
TaskSchema.methods.isAvailableForUser = async function(userId) {
  // Если задание не активно, оно доступно только администраторам и создателю
  if (!this.isActive) {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    return user && (user.role === 'admin' || this.createdBy.toString() === userId.toString());
  }
  
  // Если задание заблокировано, проверяем доступность модуля
  if (this.isLocked) {
    const Module = mongoose.model('Module');
    const module = await Module.findById(this.module);
    if (!module) {
      return false;
    }
    return await module.isAvailableForUser(userId);
  }
  
  return true;
};

// Метод для получения доступных подсказок в зависимости от времени работы
TaskSchema.methods.getAvailableHints = async function(userId, startTime) {
  if (!this.hints || this.hints.length === 0 || !this.hintTimeThresholds) {
    return [];
  }
  
  // Если время начала не указано, получаем его из прогресса пользователя
  if (!startTime) {
    const Progress = mongoose.model('Progress');
    const userProgress = await Progress.findOne({ user: userId });
    
    if (!userProgress) {
      return [];
    }
    
    // Находим прогресс по заданию
    let taskProgress = null;
    
    for (const cp of userProgress.courseProgress) {
      for (const mp of cp.moduleProgress) {
        const tp = mp.taskProgress.find(tp => tp.task.toString() === this._id.toString());
        if (tp) {
          taskProgress = tp;
          break;
        }
      }
      if (taskProgress) break;
    }
    
    if (!taskProgress || !taskProgress.startedAt) {
      return [];
    }
    
    startTime = taskProgress.startedAt;
  }
  
  // Вычисляем время в минутах с момента начала работы над заданием
  const timeSpent = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
  
  // Определяем доступные подсказки
  const availableHints = [];
  
  for (const threshold of this.hintTimeThresholds) {
    if (timeSpent >= threshold.timeInMinutes && threshold.hintIndex < this.hints.length) {
      availableHints.push({
        index: threshold.hintIndex,
        text: this.hints[threshold.hintIndex]
      });
    }
  }
  
  return availableHints;
};

module.exports = mongoose.model('Task', TaskSchema);