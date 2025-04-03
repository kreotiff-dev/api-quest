/**
 * Класс для стандартизации ошибок API
 * @extends Error
 */
class ErrorResponse extends Error {
  /**
   * Создает новый экземпляр ошибки с сообщением и статус-кодом
   * @param {string} message - Сообщение об ошибке
   * @param {number} statusCode - HTTP статус-код ошибки
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;