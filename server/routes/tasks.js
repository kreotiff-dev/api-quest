const express = require('express');
const router = express.Router();

// Импортируем middleware для защиты маршрутов
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: API для работы с заданиями
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Получение списка всех заданий
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: ID модуля для фильтрации
 *     responses:
 *       200:
 *         description: Список заданий
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
 *   post:
 *     summary: Создание нового задания
 *     tags: [Tasks]
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
 *               - module
 *               - order
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название задания
 *               description:
 *                 type: string
 *                 description: Описание задания
 *               module:
 *                 type: string
 *                 description: ID модуля
 *               order:
 *                 type: number
 *                 description: Порядковый номер задания в модуле
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Сложность задания
 *               type:
 *                 type: string
 *                 enum: [api, quiz, theory, project]
 *                 description: Тип задания
 *               apiSourceRestrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [mock, public, custom]
 *                 description: Ограничения на источники API
 *               solution:
 *                 type: object
 *                 description: Решение задания
 *               expectedResponse:
 *                 type: object
 *                 description: Ожидаемый ответ
 *               isActive:
 *                 type: boolean
 *                 description: Активность задания
 *     responses:
 *       201:
 *         description: Задание успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 *       404:
 *         description: Модуль не найден
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Получение задания по ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задания
 *     responses:
 *       200:
 *         description: Задание найдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Задание не найдено
 *   put:
 *     summary: Обновление задания
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *                 description: Название задания
 *               description:
 *                 type: string
 *                 description: Описание задания
 *               order:
 *                 type: number
 *                 description: Порядковый номер задания в модуле
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Сложность задания
 *               isActive:
 *                 type: boolean
 *                 description: Активность задания
 *               solution:
 *                 type: object
 *                 description: Решение задания
 *               expectedResponse:
 *                 type: object
 *                 description: Ожидаемый ответ
 *     responses:
 *       200:
 *         description: Задание успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Неверные данные запроса
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав для этого действия
 *       404:
 *         description: Задание не найдено
 *   delete:
 *     summary: Удаление задания
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задания
 *     responses:
 *       200:
 *         description: Задание успешно удалено
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
 *         description: Задание не найдено
 */

/**
 * @swagger
 * /api/tasks/{id}/check:
 *   post:
 *     summary: Проверка решения задания
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               method:
 *                 type: string
 *                 description: HTTP метод
 *               url:
 *                 type: string
 *                 description: URL
 *               headers:
 *                 type: object
 *                 description: Заголовки запроса
 *               body:
 *                 type: object
 *                 description: Тело запроса
 *     responses:
 *       200:
 *         description: Результат проверки
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
 *                     isCorrect:
 *                       type: boolean
 *                       description: Корректно ли решение
 *                     feedback:
 *                       type: string
 *                       description: Обратная связь
 *                     solution:
 *                       type: object
 *                       description: Информация о решении
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Задание не найдено
 */

// Импортируем контроллер заданий
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  checkTask
} = require('../controllers/tasks');

// Маршруты
router
  .route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin', 'instructor'), createTask);

router
  .route('/:id')
  .get(protect, getTask)
  .put(protect, authorize('admin', 'instructor'), updateTask)
  .delete(protect, authorize('admin'), deleteTask);

// Проверка решения задания
router.post('/:id/check', protect, checkTask);

module.exports = router;