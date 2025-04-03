const express = require('express');
const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: API для работы с прогрессом пользователей
 */

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Получение прогресса текущего пользователя
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные прогресса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Прогресс не найден
 */

/**
 * @swagger
 * /api/progress/tasks/{taskId}:
 *   post:
 *     summary: Обновление прогресса для определенного задания
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задания
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCompleted:
 *                 type: boolean
 *                 description: Выполнено ли задание
 *               solution:
 *                 type: object
 *                 description: Данные решения
 *                 properties:
 *                   method:
 *                     type: string
 *                     description: HTTP метод
 *                   url:
 *                     type: string
 *                     description: URL
 *                   headers:
 *                     type: object
 *                     description: Заголовки
 *                   body:
 *                     type: object
 *                     description: Тело запроса
 *     responses:
 *       200:
 *         description: Прогресс успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задание не найдено
 */

/**
 * @swagger
 * /api/progress/users/{userId}:
 *   get:
 *     summary: Получение прогресса указанного пользователя
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные прогресса пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Пользователь или прогресс не найдены
 */

// Импортируем контроллер прогресса
const {
  getMyProgress,
  updateTaskProgress,
  getUserProgress
} = require('../controllers/progress');

// Маршруты
router.get('/', protect, getMyProgress);
router.post('/tasks/:taskId', protect, updateTaskProgress);

// Маршруты только для администраторов/инструкторов
router.get('/users/:userId', protect, authorize('admin', 'instructor'), getUserProgress);

module.exports = router;