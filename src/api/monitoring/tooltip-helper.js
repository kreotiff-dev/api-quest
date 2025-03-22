/**
 * Вспомогательные функции для работы с всплывающими подсказками
 * @module api/monitoring/tooltip-helper
 */

/**
 * Добавляет всплывающую подсказку к элементу индикатора
 * @param {HTMLElement} indicator - Элемент индикатора
 * @param {Object} sourceInfo - Информация об источнике
 * @returns {HTMLElement} Созданный элемент подсказки
 */
export function addTooltipWhenCreatingIndicator(indicator, sourceInfo) {
  if (!indicator || !sourceInfo) return null;
  
  // Создаем элемент подсказки
  const tooltip = document.createElement('div');
  tooltip.className = 'source-tooltip';
  
  // Формируем содержимое подсказки
  const isAvailable = sourceInfo.available !== undefined 
      ? sourceInfo.available 
      : indicator.classList.contains('available');
  
  const statusClass = isAvailable ? 'available' : 'unavailable';
  const statusText = isAvailable ? 'Доступен' : 'Недоступен';
  
  tooltip.innerHTML = `
      <div class="tooltip-header">${sourceInfo.name || 'Источник API'}</div>
      <div class="tooltip-content">
          <div class="tooltip-status ${statusClass}">
              <span class="tooltip-status-dot"></span>
              ${statusText}
          </div>
          <p>Тип: ${sourceInfo.description || getSourceDescription(sourceInfo.key)}</p>
          ${sourceInfo.latency ? `<p>Задержка: ${sourceInfo.latency} мс</p>` : ''}
          ${sourceInfo.lastCheck ? `<p>Проверка: ${new Date(sourceInfo.lastCheck).toLocaleTimeString()}</p>` : ''}
          ${!isAvailable ? '<p><strong>Используется резервный источник</strong></p>' : ''}
      </div>
  `;
  
  // Добавляем подсказку в индикатор
  indicator.appendChild(tooltip);
  
  return tooltip;
}

/**
* Получает описание типа источника API
* @param {string} sourceKey - Ключ источника
* @returns {string} Описание типа
*/
function getSourceDescription(sourceKey) {
  switch (sourceKey) {
      case 'mock':
          return 'Локальный симулятор для обучения';
      case 'public':
          return 'Внешние открытые API';
      case 'custom':
          return 'Образовательные примеры API';
      default:
          return 'Неизвестный тип источника';
  }
}

/**
* Проверяет и добавляет всплывающие подсказки ко всем индикаторам
*/
export function ensureTooltips() {
  // Находим все индикаторы
  const indicators = document.querySelectorAll('.source-indicator');
  
  indicators.forEach(indicator => {
      // Проверяем, есть ли уже подсказка
      if (!indicator.querySelector('.source-tooltip')) {
          // Получаем данные из атрибутов
          const sourceKey = indicator.getAttribute('data-source');
          const title = indicator.getAttribute('title') || 'Источник API';
          const isAvailable = indicator.classList.contains('available');
          
          // Создаем простую информацию об источнике
          const sourceInfo = {
              key: sourceKey,
              name: title.split(':')[0],
              available: isAvailable
          };
          
          // Добавляем подсказку
          addTooltipWhenCreatingIndicator(indicator, sourceInfo);
      }
  });
}