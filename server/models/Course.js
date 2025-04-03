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
 *           description: Описание курса
 *         code:
 *           type: string
 *           description: Уникальный код курса
 *         isActive:
 *           type: boolean
 *           description: Активен ли курс
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
 *         code: API-101
 *         isActive: true
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
  code: {
    type: String,
    required: [true, 'Необходимо указать код курса'],
    unique: true,
    trim: true,
    maxlength: [20, 'Код не может быть длиннее 20 символов']
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

module.exports = mongoose.model('Course', CourseSchema);