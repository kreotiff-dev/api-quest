const express = require('express');
const { 
  register, 
  login, 
  logout, 
  getMe, 
  updateDetails, 
  updatePassword 
} = require('../controllers/auth');

const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Имя пользователя
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Неверные данные запроса
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       401:
 *         description: Неверные учетные данные
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успешный выход
 */
router.get('/logout', logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение данных текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       401:
 *         description: Не авторизован
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/updatedetails:
 *   put:
 *     summary: Обновление данных пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое имя пользователя
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Новый email пользователя
 *     responses:
 *       200:
 *         description: Данные успешно обновлены
 *       401:
 *         description: Не авторизован
 */
router.put('/updatedetails', protect, updateDetails);

/**
 * @swagger
 * /api/auth/updatepassword:
 *   put:
 *     summary: Обновление пароля пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Текущий пароль
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Новый пароль
 *     responses:
 *       200:
 *         description: Пароль успешно обновлен
 *       401:
 *         description: Неверный текущий пароль
 */
router.put('/updatepassword', protect, updatePassword);

module.exports = router;