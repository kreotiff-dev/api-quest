const express = require('express');
const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API для получения данных дашборда
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Получение данных для дашборда пользователя
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные дашборда
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         completedTasks:
 *                           type: number
 *                         completedModules:
 *                           type: number
 *                         completedCourses:
 *                           type: number
 *                         inProgressCourses:
 *                           type: number
 *                         overallProgress:
 *                           type: number
 *                     activeTasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     activeCourses:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Не авторизован
 */

// Импортируем контроллер дашборда
const { getDashboardData } = require('../controllers/dashboard');

// Маршруты
router.get('/', protect, getDashboardData);

module.exports = router;