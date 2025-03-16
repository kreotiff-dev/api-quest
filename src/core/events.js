/**
 * Модуль системы событий API-Quest
 * Обеспечивает коммуникацию между различными модулями приложения
 * через паттерн издатель-подписчик (pub/sub)
 */

// Хранилище обработчиков событий
const eventHandlers = {};

// Хранилище обработчиков, которые срабатывают только один раз
const onceHandlers = new Set();

/**
 * Подписка на событие
 * @param {string} eventName - Имя события
 * @param {Function} handler - Функция-обработчик
 * @return {Function} Функция для отписки от события
 */
export function on(eventName, handler) {
  if (!eventHandlers[eventName]) {
    eventHandlers[eventName] = new Set();
  }
  
  eventHandlers[eventName].add(handler);
  
  // Возвращаем функцию отписки от события
  return () => off(eventName, handler);
}

/**
 * Подписка на событие с однократным срабатыванием
 * @param {string} eventName - Имя события
 * @param {Function} handler - Функция-обработчик
 * @return {Function} Функция для отписки от события
 */
export function once(eventName, handler) {
  // Создаем обертку, которая вызовет обработчик только один раз
  const wrappedHandler = (...args) => {
    off(eventName, wrappedHandler);
    onceHandlers.delete(wrappedHandler);
    handler(...args);
  };
  
  // Сохраняем обработчик в список однократных
  onceHandlers.add(wrappedHandler);
  
  // Стандартная подписка на событие
  return on(eventName, wrappedHandler);
}

/**
 * Отписка от события
 * @param {string} eventName - Имя события
 * @param {Function} handler - Функция-обработчик
 */
export function off(eventName, handler) {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName].delete(handler);
    
    // Если обработчиков не осталось, удаляем массив
    if (eventHandlers[eventName].size === 0) {
      delete eventHandlers[eventName];
    }
  }
}

/**
 * Генерация события
 * @param {string} eventName - Имя события
 * @param {...*} args - Аргументы для передачи обработчикам
 */
export function emit(eventName, ...args) {
  if (eventHandlers[eventName]) {
    // Создаем копию множества, чтобы избежать проблем при удалении элементов во время итерации
    const handlers = Array.from(eventHandlers[eventName]);
    
    // Вызываем каждый обработчик
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });
  }
}

/**
 * Создание события с данными
 * @param {string} eventName - Имя события
 * @param {*} data - Данные события
 */
export function createEvent(eventName, data) {
  return {
    type: eventName,
    data,
    timestamp: Date.now()
  };
}

/**
 * Получение всех обработчиков для события
 * @param {string} eventName - Имя события
 * @return {Set<Function>|null} Множество обработчиков или null
 */
export function getHandlers(eventName) {
  return eventHandlers[eventName] ? new Set(eventHandlers[eventName]) : null;
}

/**
 * Проверка наличия обработчиков для события
 * @param {string} eventName - Имя события
 * @return {boolean} True, если есть обработчики
 */
export function hasHandlers(eventName) {
  return eventHandlers[eventName] && eventHandlers[eventName].size > 0;
}

/**
 * Удаление всех обработчиков для события
 * @param {string} eventName - Имя события
 */
export function clearHandlers(eventName) {
  if (eventHandlers[eventName]) {
    delete eventHandlers[eventName];
  }
}

/**
 * Удаление всех обработчиков для всех событий
 */
export function clearAllHandlers() {
  Object.keys(eventHandlers).forEach(eventName => {
    delete eventHandlers[eventName];
  });
  onceHandlers.clear();
}

// Экспортируем интерфейс модуля
export default {
  on,
  once,
  off,
  emit,
  createEvent,
  getHandlers,
  hasHandlers,
  clearHandlers,
  clearAllHandlers
};