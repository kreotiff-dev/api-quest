/**
 * Модуль для работы с заданиями
 * @module core/task
 */

/**
 * Получение текущего задания
 * @returns {Object|null} Текущее задание или null
 */
export function getCurrentTask() {
  return window.AppMain?.getCurrentTask() || null;
}