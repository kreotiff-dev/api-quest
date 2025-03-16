/**
 * Модуль для работы с индикаторами загрузки
 * @module ui/loading
 */

/**
 * Показ/скрытие индикатора загрузки
 * @param {string} containerId - ID контейнера
 * @param {boolean} show - Показать или скрыть
 */
export function toggleLoadingIndicator(containerId, show) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (show) {
      // Создаем индикатор загрузки, если его еще нет
      let loadingIndicator = container.querySelector('.loading-spinner');
      if (!loadingIndicator) {
          loadingIndicator = document.createElement('div');
          loadingIndicator.className = 'loading-spinner';
          container.appendChild(loadingIndicator);
      }
  } else {
      // Удаляем индикатор загрузки, если он есть
      const loadingIndicator = container.querySelector('.loading-spinner');
      if (loadingIndicator) {
          loadingIndicator.remove();
      }
  }
}