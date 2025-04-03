const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя (уникальный)
 *         role:
 *           type: string
 *           enum: [user, instructor, admin]
 *           description: Роль пользователя в системе
 *         activeCourse:
 *           type: string
 *           description: ID активного курса пользователя
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания аккаунта
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         name: Иван Иванов
 *         email: ivan@example.com
 *         role: user
 *         activeCourse: 60d0fe4f5311236168a109cb
 *         createdAt: 2020-04-14T16:00:00.000Z
 */

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Необходимо указать имя'],
    trim: true,
    maxlength: [50, 'Имя не может быть длиннее 50 символов']
  },
  email: {
    type: String,
    required: [true, 'Необходимо указать email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, укажите корректный email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Необходимо указать пароль'],
    minlength: [6, 'Пароль должен быть не менее 6 символов'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user'
  },
  activeCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для связи с прогрессом пользователя
UserSchema.virtual('progress', {
  ref: 'Progress',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Хеширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Подписываем и возвращаем JWT токен
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Проверка совпадения паролей
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);