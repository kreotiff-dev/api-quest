/**
 * Модуль для работы с прогрессом пользователя
 * @module core/progress
 */

// Временный мост до полной миграции ProgressManager
export function saveCurrentSolution() {
  window.ProgressManager?.saveCurrentSolution();
}

export function updateTaskAttempt(taskId) {
  window.ProgressManager?.updateTaskAttempt(taskId);
}