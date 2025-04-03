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
    enum: ['api', 'quiz', 'theory', 'project'],
    default: 'api'
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
  requiresServerResponse: {
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

module.exports = mongoose.model('Task', TaskSchema);