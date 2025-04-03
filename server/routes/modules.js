const express = require('express');
const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: API для работы с учебными модулями
 */

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Получение всех модулей
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: ID курса для фильтрации
 *     responses:
 *       200:
 *         description: Список модулей
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
 *   post:
 *     summary: Создание нового модуля
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - order
 *               - course
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название модуля
 *               description:
 *                 type: string
 *                 description: Описание модуля
 *               order:
 *                 type: number
 *                 description: Порядковый номер модуля в курсе
 *               course:
 *                 type: string
 *                 description: ID курса, к которому относится модуль
 *               isActive:
 *                 type: boolean
 *                 description: Активен ли модуль
 *     responses:
 *       201:
 *         description: Модуль успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 */

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Получение конкретного модуля по ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID модуля
 *     responses:
 *       200:
 *         description: Данные модуля
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Модуль не найден
 *   put:
 *     summary: Обновление модуля
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID модуля
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название модуля
 *               description:
 *                 type: string
 *                 description: Описание модуля
 *               order:
 *                 type: number
 *                 description: Порядковый номер модуля в курсе
 *               isActive:
 *                 type: boolean
 *                 description: Активен ли модуль
 *     responses:
 *       200:
 *         description: Модуль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 *       404:
 *         description: Модуль не найден
 *   delete:
 *     summary: Удаление модуля
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID модуля
 *     responses:
 *       200:
 *         description: Модуль успешно удален
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
 *         description: Модуль не найден
 */

/**
 * @swagger
 * /api/modules/{id}/tasks:
 *   get:
 *     summary: Получение заданий для модуля
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID модуля
 *     responses:
 *       200:
 *         description: Список заданий для модуля
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
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Модуль не найден
 */

// Импортируем контроллер модулей
const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  getModuleTasks
} = require('../controllers/modules');

// Маршруты
router
  .route('/')
  .get(protect, getModules)
  .post(protect, authorize('admin', 'instructor'), createModule);

router
  .route('/:id')
  .get(protect, getModule)
  .put(protect, authorize('admin', 'instructor'), updateModule)
  .delete(protect, authorize('admin'), deleteModule);

// Получение заданий для конкретного модуля
router.get('/:id/tasks', protect, getModuleTasks);

module.exports = router;