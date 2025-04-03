/**
 * Обертка для асинхронных контроллеров, убирающая необходимость try/catch блоков
 * @param {Function} fn - Асинхронная функция контроллера
 * @returns {Function} Middleware-функция для Express
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;