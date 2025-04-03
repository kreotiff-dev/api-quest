/**
 * Модуль управления прогрессом пользователя
 * @module data/user-progress
 */

import { getConfigValue } from '../core/config.js';
import { emit } from '../core/events.js';

// Ключ для хранения прогресса в localStorage
const STORAGE_KEY = getConfigValue('storage.keys.userProgress', 'apiQuestProgress');

// Начальное состояние прогресса пользователя
const initialUserProgress = {
    // Общий прогресс курса (процент выполненных заданий)
    courseProgress: 0,
    
    // Статусы прохождения заданий
    taskStatuses: {},
    
    // Прогресс выполнения конкретных заданий (в процентах)
    taskProgress: {},
    
    // Сохраненные решения заданий
    savedSolutions: {}
};

// Текущий прогресс пользователя
let userProgress = { ...initialUserProgress };

/**
 * Загрузка пользовательского прогресса из localStorage
 * @returns {Object} Загруженный прогресс
 */
export function loadUserProgress() {
    try {
        const savedProgress = localStorage.getItem(STORAGE_KEY);
        
        if (savedProgress) {
            const loadedProgress = JSON.parse(savedProgress);
            
            // Объединяем загруженные данные с существующими
            if (loadedProgress.taskStatuses) {
                userProgress.taskStatuses = { ...loadedProgress.taskStatuses };
            }
            
            if (loadedProgress.taskProgress) {
                userProgress.taskProgress = { ...loadedProgress.taskProgress };
            }
            
            if (loadedProgress.courseProgress) {
                userProgress.courseProgress = loadedProgress.courseProgress;
            }
            
            if (loadedProgress.savedSolutions) {
                userProgress.savedSolutions = { ...loadedProgress.savedSolutions };
            }
            
            // Генерируем событие загрузки прогресса
            emit('userProgressLoaded', userProgress);
        }
    } catch (error) {
        console.error('Ошибка при загрузке прогресса пользователя:', error);
    }
    
    return userProgress;
}

/**
 * Сохранение прогресса пользователя
 * @returns {Object} Сохраненный прогресс
 */
export function saveUserProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
        emit('userProgressSaved', userProgress);
    } catch (error) {
        console.error('Ошибка при сохранении прогресса пользователя:', error);
    }
    
    return userProgress;
}

/**
 * Получение текущего прогресса пользователя
 * @returns {Object} Текущий прогресс
 */
export function getUserProgress() {
    return { ...userProgress };
}

/**
 * Обновление прогресса курса
 * @param {Array} tasks - Массив заданий
 * @returns {number} Процент выполнения курса
 */
export function updateCourseProgress(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = Object.values(userProgress.taskStatuses)
        .filter(status => status === 'completed')
        .length;
    
    // Вычисляем процент завершения
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    // Обновляем объект прогресса
    userProgress.courseProgress = progressPercentage;
    
    // Сохраняем обновленный прогресс
    saveUserProgress();
    
    return progressPercentage;
}

/**
 * Получение статуса задания
 * @param {number} taskId - ID задания
 * @returns {string} Статус задания
 */
export function getTaskStatus(taskId) {
    return userProgress.taskStatuses[taskId] || 'not_started';
}

/**
 * Получение прогресса задания
 * @param {number} taskId - ID задания
 * @returns {number} Процент выполнения задания
 */
export function getTaskProgress(taskId) {
    return userProgress.taskProgress[taskId] || 0;
}

/**
 * Обновление прогресса задания
 * @param {number} taskId - ID задания
 * @param {number} progress - Процент выполнения
 * @returns {number} Обновленный процент выполнения
 */
export function setTaskProgress(taskId, progress) {
    userProgress.taskProgress[taskId] = Math.min(Math.max(0, progress), 100);
    saveUserProgress();
    
    emit('taskProgressUpdated', { taskId, progress: userProgress.taskProgress[taskId] });
    
    return userProgress.taskProgress[taskId];
}

/**
 * Обновление попытки задания
 * @param {number} taskId - ID задания
 * @returns {Object} Обновленный прогресс задания
 */
export function updateTaskAttempt(taskId) {
    // Обновляем статус задания
    if (userProgress.taskStatuses[taskId] !== 'completed') {
        // Если задание еще не выполнено, устанавливаем статус "in_progress"
        userProgress.taskStatuses[taskId] = 'in_progress';
    }
    
    // Увеличиваем прогресс задания, если он меньше 100%
    if ((userProgress.taskProgress[taskId] || 0) < 100) {
        userProgress.taskProgress[taskId] = Math.min(
            (userProgress.taskProgress[taskId] || 0) + 10, 
            90 // Максимум 90% до полного выполнения
        );
    }
    
    // Сохраняем прогресс
    saveUserProgress();
    
    // Генерируем событие обновления попытки
    emit('taskAttemptUpdated', { 
        taskId, 
        status: userProgress.taskStatuses[taskId],
        progress: userProgress.taskProgress[taskId]
    });
    
    return {
        status: userProgress.taskStatuses[taskId],
        progress: userProgress.taskProgress[taskId]
    };
}

/**
 * Обновление статуса задания
 * @param {number} taskId - ID задания
 * @param {string} status - Новый статус
 * @returns {string} Установленный статус
 */
export function setTaskStatus(taskId, status) {
    if (!['not_started', 'in_progress', 'completed', 'locked'].includes(status)) {
        throw new Error(`Недопустимый статус задания: ${status}`);
    }
    
    userProgress.taskStatuses[taskId] = status;
    
    // Если статус "выполнено", устанавливаем прогресс 100%
    if (status === 'completed') {
        userProgress.taskProgress[taskId] = 100;
    }
    
    // Сохраняем прогресс
    saveUserProgress();
    
    // Генерируем событие обновления статуса
    emit('taskStatusUpdated', { taskId, status });
    
    return status;
}

/**
 * Пометка задания как выполненного
 * @param {number} taskId - ID задания
 * @param {Array} tasks - Массив всех заданий
 * @returns {Object} Результат операции
 */
export function markTaskAsCompleted(taskId, tasks) {
    // Обновляем статус "выполнено"
    userProgress.taskStatuses[taskId] = 'completed';
    userProgress.taskProgress[taskId] = 100;
    
    // Сохраняем прогресс
    saveUserProgress();
    
    // Обновляем прогресс курса
    const courseProgress = updateCourseProgress(tasks);
    
    // Проверяем возможность разблокировки следующих заданий
    const unlockedTasks = checkTasksUnlocking(tasks);
    
    // Генерируем событие завершения задания
    emit('taskCompleted', { 
        taskId, 
        courseProgress,
        unlockedTasks
    });
    
    return {
        status: 'completed',
        progress: 100,
        courseProgress,
        unlockedTasks
    };
}

/**
 * Проверка возможности разблокировки следующих заданий
 * @param {Array} tasks - Массив всех заданий
 * @returns {Array} Массив разблокированных заданий
 */
export function checkTasksUnlocking(tasks) {
    // Получаем все заблокированные задания
    const lockedTasks = tasks.filter(task => 
        userProgress.taskStatuses[task.id] === 'locked'
    );
    
    const unlockedTasks = [];
    
    // Проверяем зависимости и разблокируем задания
    lockedTasks.forEach(task => {
        if (task.dependencies) {
            // Проверяем выполнение всех зависимостей
            const allDependenciesCompleted = task.dependencies.every(depId => 
                userProgress.taskStatuses[depId] === 'completed'
            );
            
            if (allDependenciesCompleted) {
                // Разблокируем задание
                userProgress.taskStatuses[task.id] = 'not_started';
                userProgress.taskProgress[task.id] = 0;
                
                unlockedTasks.push(task);
            }
        }
    });
    
    // Сохраняем прогресс, если разблокировали задания
    if (unlockedTasks.length > 0) {
        saveUserProgress();
    }
    
    return unlockedTasks;
}

/**
 * Получение сохраненного решения задания
 * @param {number} taskId - ID задания
 * @returns {Object|null} Сохраненное решение или null
 */
export function getSavedSolution(taskId) {
    return userProgress.savedSolutions[taskId] || null;
}

/**
 * Сохранение решения задания
 * @param {number} taskId - ID задания
 * @param {Object} solution - Решение
 * @returns {Object} Сохраненное решение
 */
export function saveSolution(taskId, solution) {
    userProgress.savedSolutions[taskId] = solution;
    saveUserProgress();
    
    // Генерируем событие сохранения решения
    emit('solutionSaved', { taskId, solution });
    
    return solution;
}

/**
 * Сброс прогресса пользователя
 * @param {boolean} confirmReset - Подтверждение сброса
 * @returns {boolean} Успешность операции
 */
export function resetUserProgress(confirmReset = false) {
    if (!confirmReset) {
        return false;
    }
    
    // Сбрасываем прогресс к начальному состоянию
    userProgress = { ...initialUserProgress };
    
    // Сохраняем сброшенный прогресс
    saveUserProgress();
    
    // Генерируем событие сброса прогресса
    emit('userProgressReset');
    
    return true;
}

/**
 * Получение всех заданий из внешнего модуля
 * @returns {Array} Массив всех заданий
 */
export function getAllTasks() {
    try {
        // Пытаемся импортировать задания из модуля tasks
        return window.allTasks || [];
    } catch (error) {
        console.error('Ошибка при получении всех заданий:', error);
        return [];
    }
}

export default {
    loadUserProgress,
    saveUserProgress,
    getUserProgress,
    updateCourseProgress,
    getTaskStatus,
    getTaskProgress,
    setTaskProgress,
    updateTaskAttempt,
    setTaskStatus,
    markTaskAsCompleted,
    checkTasksUnlocking,
    getSavedSolution,
    saveSolution,
    resetUserProgress,
    getAllTasks
};