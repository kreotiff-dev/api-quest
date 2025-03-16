/**
 * Модуль для работы с заданиями
 * @module core/tasks
 */
import taskList from '../tasks/index.js';
import { tasks as tasksData } from '../data/tasks.js';
import eventBus from './events.js';
import * as taskListUI from './task-list.js';

/**
 * Получение текущего задания
 * @returns {Object|null} Текущее задание или null
 */
export function getCurrentTask() {
  return window.AppMain?.getCurrentTask() || null;
}

/**
 * Загружает задания
 * @returns {Promise<void>}
 */
export async function loadTasks() {
  try {
    // Загружаем задания из модуля данных
    taskList.loadTasks(tasksData);
    console.log(`Загружено ${tasksData.length} заданий`);
    
    // Подписываемся на событие загрузки заданий для их отображения
    eventBus.on('tasksLoaded', (tasks) => {
      console.log(`Отображаем ${tasks.length} заданий`);
      // Отрисовываем список заданий после их загрузки
      taskListUI.renderTaskList();
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Ошибка при загрузке заданий:', error);
    return Promise.reject(error);
  }
}

/**
 * Проверка выполнения задания
 * @returns {boolean} Результат проверки
 */
export function checkTaskCompletion() {
  const currentTask = getCurrentTask();
  if (!currentTask) {
    console.warn('Невозможно проверить выполнение: текущее задание не выбрано');
    return false;
  }
  
  // Здесь будет логика проверки выполнения задания
  // Пока просто заглушка
  const result = true;
  
  if (result) {
    eventBus.emit('taskCompleted', currentTask);
  }
  
  return result;
}

/**
 * Получение подсказки для текущего задания
 * @returns {string|null} Текст подсказки или null
 */
export function getHint() {
  const currentTask = getCurrentTask();
  if (!currentTask) {
    console.warn('Невозможно получить подсказку: текущее задание не выбрано');
    return null;
  }
  
  // Здесь будет логика получения подсказки
  // Пока просто заглушка
  const hint = `Подсказка для задания "${currentTask.title}"`;
  
  eventBus.emit('hintRequested', { task: currentTask, hint });
  
  return hint;
}

/**
 * Получение задания по идентификатору
 * @param {number|string} id - Идентификатор задания
 * @returns {Object|null} Задание или null
 */
export function getTaskById(id) {
  return taskList.getTaskById(id);
}

/**
 * Получение всех заданий
 * @returns {Array} Массив заданий
 */
export function getAllTasks() {
  return taskList.getAllTasks();
}

// Экспорт для обратной совместимости
export default {
  getCurrentTask,
  loadTasks,
  checkTaskCompletion,
  getHint,
  getTaskById,
  getAllTasks
};