const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - code
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID курса
 *         name:
 *           type: string
 *           description: Название курса
 *         description:
 *           type: string
 *           description: Полное описание курса
 *         shortDescription:
 *           type: string
 *           description: Краткое описание курса
 *         code:
 *           type: string
 *           description: Уникальный код курса
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: Уровень сложности курса
 *         imageUrl:
 *           type: string
 *           description: URL изображения для курса
 *         duration:
 *           type: number
 *           description: Продолжительность курса в часах
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Теги курса
 *         isActive:
 *           type: boolean
 *           description: Активен ли курс
 *         isPublic:
 *           type: boolean
 *           description: Доступен ли курс всем пользователям
 *         prerequisites:
 *           type: array
 *           items:
 *             type: string
 *           description: ID курсов, которые нужно пройти перед этим
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания курса
 *         createdBy:
 *           type: string
 *           description: ID пользователя, создавшего курс
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления курса
 *         updatedBy:
 *           type: string
 *           description: ID пользователя, последним обновившего курс
 *       example:
 *         _id: 60d0fe4f5311236168a109cb
 *         name: API Fundamentals
 *         description: Основы работы с API и REST архитектурой
 *         shortDescription: Вводный курс по API
 *         code: API-101
 *         level: beginner
 *         imageUrl: https://example.com/images/api-course.jpg
 *         duration: 10
 *         tags: [API, REST, HTTP]
 *         isActive: true
 *         isPublic: true
 *         prerequisites: []
 *         createdAt: 2020-04-14T16:00:00.000Z
 *         createdBy: 60d0fe4f5311236168a109ca
 *         updatedAt: 2020-04-14T16:00:00.000Z
 */

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Необходимо указать название курса'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Необходимо указать описание курса']
  },
  shortDescription: {
    type: String,
    maxlength: [255, 'Краткое описание не может быть длиннее 255 символов']
  },
  code: {
    type: String,
    required: [true, 'Необходимо указать код курса'],
    unique: true,
    trim: true,
    maxlength: [20, 'Код не может быть длиннее 20 символов']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  imageUrl: {
    type: String
  },
  duration: {
    type: Number, // в часах
    default: 0
  },
  tags: {
    type: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Необходимо указать создателя курса']
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

// Виртуальное поле для связи с модулями
CourseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Автоматическое обновление даты изменения
CourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Метод для получения прогресса пользователя по курсу
CourseSchema.methods.getUserProgress = async function(userId) {
  const Progress = mongoose.model('Progress');
  const userProgress = await Progress.findOne({ user: userId });
  
  if (!userProgress) {
    return null;
  }
  
  const courseProgress = userProgress.courseProgress.find(
    cp => cp.course.toString() === this._id.toString()
  );
  
  return courseProgress || null;
};

// Метод для проверки доступности курса для пользователя
CourseSchema.methods.isAvailableForUser = async function(userId) {
  // Если курс не активен, он доступен только администраторам и создателю
  if (!this.isActive) {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    return user && (user.role === 'admin' || this.createdBy.toString() === userId.toString());
  }
  
  // Если курс не имеет предварительных требований, он доступен всем
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return true;
  }
  
  // Проверяем, выполнены ли все предварительные требования
  const Progress = mongoose.model('Progress');
  const userProgress = await Progress.findOne({ user: userId });
  
  if (!userProgress) {
    return false;
  }
  
  for (const prerequisiteId of this.prerequisites) {
    const prerequisiteProgress = userProgress.courseProgress.find(
      cp => cp.course.toString() === prerequisiteId.toString()
    );
    
    // Если прогресс по предварительному курсу не найден или курс не завершен, возвращаем false
    if (!prerequisiteProgress || !prerequisiteProgress.completedAt) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('Course', CourseSchema);