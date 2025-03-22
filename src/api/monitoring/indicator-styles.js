/**
 * Добавление стилей для индикаторов
 */
export function addIndicatorStyles() {
    if (document.getElementById('api-source-indicator-styles')) {
      return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'api-source-indicator-styles';
    styles.textContent = `
      .api-source-indicator {
        display: flex;
        gap: 10px;
        margin-right: 15px;
      }
      
      .source-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px;
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        --indicator-color: #95a5a6;
      }
      
      .source-indicator:hover {
        background-color: rgba(0,0,0,0.1);
      }
      
      .source-indicator.active {
        background-color: rgba(0,0,0,0.2);
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        border: 1px solid var(--indicator-color);
      }
      
      .source-indicator.available .status-dot {
        background-color: var(--indicator-color);
      }
      
      .source-indicator.unavailable .status-dot {
        background-color: transparent;
      }
      
      .source-indicator i {
        color: var(--indicator-color);
        font-size: 14px;
      }
      
      /* Пульсирующая анимация для активного источника */
      .status-dot.pulse {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(var(--indicator-color), 0.7);
        }
        70% {
          box-shadow: 0 0 0 5px rgba(var(--indicator-color), 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(var(--indicator-color), 0);
        }
      }
      
      /* Стили для иконки замка на недоступных источниках */
      .source-indicator.unavailable {
        position: relative;
        opacity: 0.7;
      }
      
      .source-indicator.unavailable::after {
        content: "\\f023"; /* Unicode для иконки замка в Font Awesome */
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        position: absolute;
        bottom: -3px;
        right: -3px;
        font-size: 9px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 50%;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }
      
      /* Стили для подробной всплывающей подсказки */
      .source-tooltip {
        position: absolute;
        z-index: 1000;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 0;
        min-width: 200px;
        max-width: 250px;
        display: none;
      }
      
      .tooltip-header {
        padding: 8px 10px;
        background-color: #f0f0f0;
        border-bottom: 1px solid #e0e0e0;
        font-weight: bold;
        color: #333;
      }
      
      .tooltip-content {
        padding: 8px 10px;
      }
      
      .tooltip-content p {
        margin: 5px 0;
        color: #555;
        font-size: 12px;
      }
      
      .tooltip-status {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 8px;
      }
      
      .tooltip-status.available {
        color: #27ae60;
      }
      
      .tooltip-status.unavailable {
        color: #e74c3c;
      }
      
      .tooltip-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      
      .tooltip-status.available .tooltip-status-dot {
        background-color: #27ae60;
      }
      
      .tooltip-status.unavailable .tooltip-status-dot {
        background-color: #e74c3c;
      }
      
      /* Адаптивные стили */
      @media (max-width: 768px) {
        .api-source-indicator {
          margin: 10px 0;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }