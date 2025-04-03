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
 *           description: Описание модуля
 *         order:
 *           type: number
 *           description: Порядковый номер модуля в курсе
 *         course:
 *           type: string
 *           description: ID курса, к которому относится модуль
 *         isActive:
 *           type: boolean
 *           description: Активен ли модуль
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
 *         order: 1
 *         course: 60d0fe4f5311236168a109cb
 *         isActive: true
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
  order: {
    type: Number,
    required: [true, 'Необходимо указать порядковый номер модуля']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Необходимо указать принадлежность к курсу']
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

// Автоматическое обновление даты изменения
ModuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Module', ModuleSchema);