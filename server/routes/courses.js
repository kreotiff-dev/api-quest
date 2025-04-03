const express = require('express');
const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API для работы с курсами
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Получение всех курсов
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список курсов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Не авторизован
 *   post:
 *     summary: Создание нового курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название курса
 *               description:
 *                 type: string
 *                 description: Описание курса
 *               code:
 *                 type: string
 *                 description: Уникальный код курса
 *               isActive:
 *                 type: boolean
 *                 description: Активен ли курс
 *     responses:
 *       201:
 *         description: Курс успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 */

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Получение конкретного курса по ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Данные курса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Курс не найден
 *   put:
 *     summary: Обновление курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID курса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название курса
 *               description:
 *                 type: string
 *                 description: Описание курса
 *               code:
 *                 type: string
 *                 description: Уникальный код курса
 *               isActive:
 *                 type: boolean
 *                 description: Активен ли курс
 *     responses:
 *       200:
 *         description: Курс успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 *       404:
 *         description: Курс не найден
 *   delete:
 *     summary: Удаление курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Курс успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 *       404:
 *         description: Курс не найден
 */

/**
 * @swagger
 * /api/courses/{id}/modules:
 *   get:
 *     summary: Получение модулей для курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Список модулей для курса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Курс не найден
 */

// Импортируем контроллер курсов
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseModules
} = require('../controllers/courses');

// Маршруты
router
  .route('/')
  .get(protect, getCourses)
  .post(protect, authorize('admin', 'instructor'), createCourse);

router
  .route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('admin', 'instructor'), updateCourse)
  .delete(protect, authorize('admin'), deleteCourse);

// Получение модулей для конкретного курса
router.get('/:id/modules', protect, getCourseModules);

module.exports = router;