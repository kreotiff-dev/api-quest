// apiSourceIndicator.js - Модуль визуального индикатора состояния API-источников

const ApiSourceIndicator = (function() {
  // Приватные переменные и функции
  
  // Конфигурация индикаторов для разных источников
  const sourceConfig = {
      mock: {
          name: 'Симулятор API',
          icon: 'fa-server',
          color: '#3498db'
      },
      public: {
          name: 'Публичные API',
          icon: 'fa-globe',
          color: '#2ecc71'
      },
      custom: {
          name: 'Учебный API',
          icon: 'fa-graduation-cap',
          color: '#9b59b6'
      }
  };
  
  // Состояние индикаторов
  const indicatorState = {
      mock: { available: true, latency: 0, lastCheck: Date.now() },
      public: { available: false, latency: 0, lastCheck: Date.now() },
      custom: { available: false, latency: 0, lastCheck: Date.now() }
  };
  
  // Создание индикатора состояния
  function createIndicator() {
      // Проверяем, существует ли уже индикатор
      let indicatorContainer = document.getElementById('api-source-indicator');
      
      if (!indicatorContainer) {
          // Создаем контейнер для индикатора
          indicatorContainer = document.createElement('div');
          indicatorContainer.id = 'api-source-indicator';
          indicatorContainer.className = 'api-source-indicator';
          
          // Находим место для добавления индикатора (рядом с источниками API)
          const headerActions = document.querySelector('.content-header .actions');
          
          if (headerActions) {
              // Вставляем перед селектором источников, если он есть
              const sourceSelector = headerActions.querySelector('.api-source-selector-container');
              if (sourceSelector) {
                  headerActions.insertBefore(indicatorContainer, sourceSelector);
              } else {
                  headerActions.appendChild(indicatorContainer);
              }
          } else {
              // Если не нашли нужный контейнер, добавляем в конец header
              const header = document.querySelector('.main-header');
              if (header) {
                  header.appendChild(indicatorContainer);
              } else {
                  return null; // Не нашли подходящего места
              }
          }
          
          // Добавляем стили
          addStyles();
      }
      
      // Обновляем содержимое индикатора
      updateIndicator();
      
      return indicatorContainer;
  }
  
  // Обновление состояния индикатора
  function updateIndicator() {
      const indicatorContainer = document.getElementById('api-source-indicator');
      if (!indicatorContainer) return;
      
      // Очищаем контейнер
      indicatorContainer.innerHTML = '';
      
      // Получаем информацию о текущем источнике
      const currentSource = ApiSourceManager.getCurrentSourceInfo();
      
      // Создаем индикаторы для каждого источника
      for (const [sourceKey, state] of Object.entries(indicatorState)) {
          // Получаем конфигурацию для источника
          const config = sourceConfig[sourceKey] || {
              name: 'Неизвестный источник',
              icon: 'fa-question-circle',
              color: '#95a5a6'
          };
          
          // Создаем элемент индикатора
          const indicator = document.createElement('div');
          indicator.className = `source-indicator ${state.available ? 'available' : 'unavailable'} ${sourceKey === currentSource.key ? 'active' : ''}`;
          indicator.title = `${config.name}: ${state.available ? 'Доступен' : 'Недоступен'}`;
          
          // Задаем стиль в зависимости от состояния
          indicator.style.setProperty('--indicator-color', config.color);
          
          // Создаем индикатор статуса
          const statusDot = document.createElement('span');
          statusDot.className = 'status-dot';
          
          // Создаем иконку
          const icon = document.createElement('i');
          icon.className = `fas ${config.icon}`;
          
          // Добавляем анимацию "пульса" для текущего источника
          if (sourceKey === currentSource.key) {
              statusDot.classList.add('pulse');
          }
          
          // Собираем индикатор
          indicator.appendChild(statusDot);
          indicator.appendChild(icon);
          
          // Добавляем обработчик клика для быстрого переключения
          indicator.addEventListener('click', () => {
              if (sourceKey !== currentSource.key) {
                  ApiSourceManager.setApiSource(sourceKey);
              }
          });
          
          // Добавляем в контейнер
          indicatorContainer.appendChild(indicator);
      }
  }
  
  // Обновление состояния источников на основе данных ApiSourceManager
  function updateSourceState() {
      // Получаем доступные источники из ApiSourceManager
      const availableSources = ApiSourceManager.getAvailableSources();
      
      // Обновляем состояние индикаторов
      for (const source of availableSources) {
          if (indicatorState[source.key]) {
              indicatorState[source.key].available = true;
              indicatorState[source.key].lastCheck = Date.now();
          }
      }
      
      // Для оставшихся источников, которых нет в списке доступных
      for (const sourceKey in indicatorState) {
          if (!availableSources.some(s => s.key === sourceKey)) {
              indicatorState[sourceKey].available = false;
              indicatorState[sourceKey].lastCheck = Date.now();
          }
      }
      
      // Mock всегда доступен
      indicatorState.mock.available = true;
      
      // Обновляем отображение
      updateIndicator();
  }
  
  // Измерение латентности для источников API
  async function measureLatency(sourceKey) {
      if (!indicatorState[sourceKey] || sourceKey === 'mock') {
          return; // Пропускаем для mock или несуществующих источников
      }
      
      const startTime = performance.now();
      
      try {
          let url;
          if (sourceKey === 'public') {
              url = apiSourceConfig.public.baseUrl + '/health';
          } else if (sourceKey === 'custom') {
              url = apiSourceConfig.custom.baseUrl + '/health';
          } else {
              return;
          }
          
          const response = await fetch(url, {
              method: 'GET',
              headers: {'X-API-Quest-Client': 'Health-Check'},
              cache: 'no-cache'
          });
          
          const endTime = performance.now();
          const latency = Math.round(endTime - startTime);
          
          // Обновляем состояние
          indicatorState[sourceKey].latency = latency;
          indicatorState[sourceKey].available = response.ok;
          indicatorState[sourceKey].lastCheck = Date.now();
          
          // Обновляем индикатор с новой латентностью
          updateIndicator();
          
      } catch (error) {
          const endTime = performance.now();
          
          // Обновляем состояние - недоступен
          indicatorState[sourceKey].available = false;
          indicatorState[sourceKey].latency = Math.round(endTime - startTime);
          indicatorState[sourceKey].lastCheck = Date.now();
          
          // Обновляем индикатор
          updateIndicator();
      }
  }
  
  // Запуск периодических проверок латентности
  function startLatencyChecks() {
      // Сначала измеряем для всех источников
      measureLatency('public');
      measureLatency('custom');
      
      // Затем запускаем периодические проверки
      setInterval(() => {
          measureLatency('public');
          measureLatency('custom');
      }, 60000); // Проверка каждую минуту
  }
  
  // Добавление стилей для индикаторов
  function addStyles() {
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
    
    // Инициализация модуля
    function init() {
        // Создаем индикатор состояния
        createIndicator();
        
        // Обновляем состояние на основе данных ApiSourceManager
        updateSourceState();
        
        // Запускаем проверки латентности
        startLatencyChecks();
        
        // Добавляем слушатель событий для обновления индикатора при изменении источника
        document.addEventListener('apiSourceChanged', updateSourceState);
        
        // Периодически обновляем индикатор
        setInterval(updateSourceState, 30000); // Обновляем каждые 30 секунд
    }
    
    // Добавление сообщения уведомления о проблемах с источником API
    function showSourceStatusNotification(sourceKey, available) {
        if (!sourceKey) return;
        
        const source = sourceConfig[sourceKey] || { name: 'Неизвестный источник' };
        
        if (available) {
            UI.showNotification(`${source.name} снова доступен`, 'success');
        } else {
            UI.showNotification(`${source.name} недоступен, используется резервный источник`, 'warning');
        }
    }
    
    // Проверка изменений в доступности источников
    function checkAvailabilityChanges(newState) {
        // Сравниваем текущее состояние с предыдущим
        for (const sourceKey in indicatorState) {
            if (newState[sourceKey]) {
                const wasAvailable = indicatorState[sourceKey].available;
                const isAvailable = newState[sourceKey].available;
                
                // Если статус изменился, показываем уведомление
                if (wasAvailable !== isAvailable) {
                    showSourceStatusNotification(sourceKey, isAvailable);
                }
            }
        }
    }
    
    // Получение HTML для всплывающей подсказки
    function getTooltipContent(sourceKey) {
        if (!indicatorState[sourceKey]) return '';
        
        const state = indicatorState[sourceKey];
        const config = sourceConfig[sourceKey] || { name: 'Неизвестный источник' };
        
        let content = `<strong>${config.name}</strong><br>`;
        content += `Статус: ${state.available ? 'Доступен' : 'Недоступен'}<br>`;
        
        if (state.latency > 0) {
            content += `Задержка: ${state.latency} мс<br>`;
        }
        
        if (state.lastCheck) {
            const lastCheckTime = new Date(state.lastCheck).toLocaleTimeString();
            content += `Последняя проверка: ${lastCheckTime}`;
        }
        
        return content;
    }
    
    // Обновление подсказок для индикаторов
    function updateTooltips() {
        for (const sourceKey in indicatorState) {
            const indicator = document.querySelector(`.source-indicator[data-source="${sourceKey}"]`);
            if (indicator) {
                const tooltipContent = getTooltipContent(sourceKey);
                indicator.title = tooltipContent;
                
                // Если используется библиотека для более продвинутых подсказок
                if (window.tippy) {
                    tippy(indicator, {
                        content: tooltipContent,
                        allowHTML: true
                    });
                }
            }
        }
    }
    
    // Публичное API модуля
    return {
        init,
        updateSourceState,
        measureLatency,
        getSourceState: function(sourceKey) {
            return sourceKey ? indicatorState[sourceKey] : { ...indicatorState };
        }
    };
})();

// Добавляем слушатель событий для инициализации модуля после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, что ApiSourceManager существует
    if (window.ApiSourceManager) {
        // Инициализируем индикатор после инициализации ApiSourceManager
        setTimeout(() => {
            ApiSourceIndicator.init();
        }, 500);
    } else {
        console.error('ApiSourceManager не найден. ApiSourceIndicator не может быть инициализирован.');
    }
});

// Экспортируем модуль в глобальную область видимости
window.ApiSourceIndicator = ApiSourceIndicator;