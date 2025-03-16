/**
 * Стили для индикаторов API-источников
 * @module api/monitoring/indicator-styles
 */

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
      
      /* Адаптивные стили */
      @media (max-width: 768px) {
          .api-source-indicator {
              margin: 10px 0;
          }
      }
  `;
  
  document.head.appendChild(styles);
}