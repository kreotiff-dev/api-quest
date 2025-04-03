const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Module:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - order
 *         - course
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID модуля
 *         title:
 *           type: string
 *           description: Название модуля
 *         description:
 *           type: string
 *           description: Полное описание модуля
 *         shortDescription:
 *           type: string
 *           description: Краткое описание модуля
 *         order:
 *           type: number
 *           description: Порядковый номер модуля в курсе
 *         course:
 *           type: string
 *           description: ID курса, к которому относится модуль
 *         duration:
 *           type: number
 *           description: Продолжительность модуля в минутах
 *         imageUrl:
 *           type: string
 *           description: URL изображения для модуля
 *         isActive:
 *           type: boolean
 *           description: Активен ли модуль
 *         isLocked:
 *           type: boolean
 *           description: Заблокирован ли модуль для прохождения
 *         requiredModules:
 *           type: array
 *           items:
 *             type: string
 *           description: ID модулей, которые нужно пройти перед этим
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Теги модуля
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания модуля
 *         createdBy:
 *           type: string
 *           description: ID пользователя, создавшего модуль
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления модуля
 *         updatedBy:
 *           type: string
 *           description: ID пользователя, последним обновившего модуль
 *       example:
 *         _id: 60d0fe4f5311236168a109cd
 *         title: Введение в RESTful API
 *         description: Основы работы с REST API и HTTP методами
 *         shortDescription: Знакомство с REST API
 *         order: 1
 *         course: 60d0fe4f5311236168a109cb
 *         duration: 60
 *         imageUrl: https://example.com/images/rest-module.jpg
 *         isActive: true
 *         isLocked: false
 *         requiredModules: []
 *         tags: [REST, HTTP, API]
 *         createdAt: 2020-04-14T16:00:00.000Z
 *         createdBy: 60d0fe4f5311236168a109ca
 *         updatedAt: 2020-04-14T16:00:00.000Z
 *         updatedBy: 60d0fe4f5311236168a109ca
 */

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Необходимо указать название модуля'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Необходимо указать описание модуля']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Краткое описание не может быть длиннее 200 символов']
  },
  order: {
    type: Number,
    required: [true, 'Необходимо указать порядковый номер модуля']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Необходимо указать принадлежность к курсу']
  },
  duration: {
    type: Number, // в минутах
    default: 0
  },
  imageUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  requiredModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  tags: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Необходимо указать создателя модуля']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для связи с заданиями
ModuleSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'module',
  justOne: false
});

// Индекс для быстрого поиска модулей по курсу и порядковому номеру
ModuleSchema.index({ course: 1, order: 1 }, { unique: true });

// Автоматическое обновление даты изменения
ModuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Метод для получения прогресса пользователя по модулю
ModuleSchema.methods.getUserProgress = async function(userId, courseId) {
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
    mp => mp.module.toString() === this._id.toString()
  );
  
  return moduleProgress || null;
};

// Метод для проверки доступности модуля для пользователя
ModuleSchema.methods.isAvailableForUser = async function(userId) {
  // Если модуль не активен, он доступен только администраторам и создателю
  if (!this.isActive) {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    return user && (user.role === 'admin' || this.createdBy.toString() === userId.toString());
  }
  
  // Если модуль заблокирован, проверяем требования
  if (this.isLocked) {
    // Если модуль не имеет предварительных требований, проверяем доступность курса
    if (!this.requiredModules || this.requiredModules.length === 0) {
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course);
      if (!course) {
        return false;
      }
      return await course.isAvailableForUser(userId);
    }
    
    // Проверяем, выполнены ли все требуемые модули
    const Progress = mongoose.model('Progress');
    const userProgress = await Progress.findOne({ user: userId });
    
    if (!userProgress) {
      return false;
    }
    
    const courseProgress = userProgress.courseProgress.find(
      cp => cp.course.toString() === this.course.toString()
    );
    
    if (!courseProgress) {
      return false;
    }
    
    for (const requiredModuleId of this.requiredModules) {
      const requiredModuleProgress = courseProgress.moduleProgress.find(
        mp => mp.module.toString() === requiredModuleId.toString()
      );
      
      // Если прогресс по требуемому модулю не найден или модуль не завершен, возвращаем false
      if (!requiredModuleProgress || !requiredModuleProgress.completedAt) {
        return false;
      }
    }
  }
  
  return true;
};

module.exports = mongoose.model('Module', ModuleSchema);