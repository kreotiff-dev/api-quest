/**
 * Модуль конфигурации приложения API-Quest
 * Обеспечивает централизованное управление всеми настройками приложения
 */

// Определение режимов работы приложения
export const APP_MODES = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
  };
  
  // Определение источников API
  export const API_SOURCES = {
    MOCK: 'mock',
    PUBLIC: 'public',
    CUSTOM: 'custom'
  };
  
  // Базовая конфигурация по умолчанию
  const defaultConfig = {
    // Версия приложения
    version: '1.1.0',
    
    // Режим работы
    mode: APP_MODES.DEVELOPMENT,
    
    // API источники
    apiSources: {
      [API_SOURCES.MOCK]: {
        name: "Симулятор API",
        description: "Локальные моки для обучения без внешних зависимостей",
        baseUrl: "",
        priority: 1,
        isAvailable: true // Моки всегда доступны
      },
      [API_SOURCES.PUBLIC]: {
        name: "Публичные API",
        description: "Набор бесплатных публичных API для практики",
        baseUrl: "https://jsonplaceholder.typicode.com",
        priority: 2,
        isAvailable: false // Будет определено при инициализации
      },
      [API_SOURCES.CUSTOM]: {
        name: "Учебный API",
        description: "Собственный API платформы с расширенными возможностями",
        baseUrl: "https://api-quest.example.com/api",
        priority: 3,
        isAvailable: false // Будет определено при инициализации
      }
    },
    
    // Настройки хранения данных
    storage: {
      keys: {
        userProgress: 'apiQuestProgress',
        selectedApiSource: 'apiQuestSelectedSource',
        httpLogs: 'apiQuestHttpLogs',
        aiChatHistory: 'aiChatHistory'
      },
      maxEntries: {
        logs: 100,
        chatHistory: 20
      }
    },
    
    // Настройки UI
    ui: {
      theme: 'light',
      animationsEnabled: true,
      notificationDuration: 5000, // мс
      modalCloseOnEsc: true,
      modalCloseOnOutsideClick: true
    },
    
    // Настройки HTTP-логгера
    httpLogger: {
      enabled: true,
      logToConsole: true,
      logToStorage: true,
      maxLogEntries: 100
    },
    
    // Настройки AI-ассистента
    aiAssistant: {
      enabled: true,
      useExternalApi: false,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      modelName: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7
    },
    
    // Настройки для мониторинга
    monitoring: {
      apiCheckInterval: 60000, // 60 секунд
      latencyCheckInterval: 300000 // 5 минут
    }
  };
  
  // Варианты настроек для разных режимов
  const modeSpecificConfigs = {
    [APP_MODES.DEVELOPMENT]: {
      httpLogger: {
        logToConsole: true
      }
    },
    [APP_MODES.STAGING]: {
      httpLogger: {
        logToConsole: false
      }
    },
    [APP_MODES.PRODUCTION]: {
      httpLogger: {
        logToConsole: false
      },
      monitoring: {
        apiCheckInterval: 300000 // 5 минут
      }
    }
  };
  
  // Текущая активная конфигурация
  let currentConfig = { ...defaultConfig };
  
  /**
   * Обнаружение режима приложения
   * @return {string} Режим приложения
   */
  function detectAppMode() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return APP_MODES.DEVELOPMENT;
    } else if (location.hostname.includes('staging') || location.hostname.includes('test')) {
      return APP_MODES.STAGING;
    } else {
      return APP_MODES.PRODUCTION;
    }
  }
  
  /**
   * Глубокое объединение объектов
   * @param {Object} target - Целевой объект
   * @param {Object} source - Исходный объект
   * @return {Object} Объединенный объект
   */
  function mergeDeep(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = mergeDeep(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }
  
  /**
   * Проверка, является ли значение объектом
   * @param {*} item - Проверяемое значение
   * @return {boolean} True, если значение является объектом
   */
  function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  /**
   * Инициализация конфигурации
   * @param {Object} customConfig - Пользовательские настройки
   */
  export function initConfig(customConfig = {}) {
    // Определяем режим работы
    const detectedMode = customConfig.mode || detectAppMode();
    
    // Применяем настройки для конкретного режима
    let config = { ...defaultConfig };
    if (modeSpecificConfigs[detectedMode]) {
      config = mergeDeep(config, modeSpecificConfigs[detectedMode]);
    }
    
    // Применяем пользовательские настройки
    config = mergeDeep(config, customConfig);
    
    // Устанавливаем режим
    config.mode = detectedMode;
    
    // Сохраняем конфигурацию
    currentConfig = config;
    
    return config;
  }
  
  /**
   * Получение полной конфигурации
   * @return {Object} Текущая конфигурация
   */
  export function getConfig() {
    return { ...currentConfig };
  }
  
  /**
   * Получение отдельного параметра конфигурации
   * @param {string} path - Путь к параметру (например, 'apiSources.mock.baseUrl')
   * @param {*} defaultValue - Значение по умолчанию, если параметр не найден
   * @return {*} Значение параметра или значение по умолчанию
   */
  export function getConfigValue(path, defaultValue = undefined) {
    const props = path.split('.');
    let result = currentConfig;
    
    for (const prop of props) {
      if (result && result[prop] !== undefined) {
        result = result[prop];
      } else {
        return defaultValue;
      }
    }
    
    return result;
  }
  
  /**
   * Обновление конфигурации
   * @param {Object} newConfig - Новые настройки
   */
  export function updateConfig(newConfig) {
    currentConfig = mergeDeep(currentConfig, newConfig);
    return { ...currentConfig };
  }
  
  /**
   * Установка отдельного параметра конфигурации
   * @param {string} path - Путь к параметру (например, 'apiSources.mock.baseUrl')
   * @param {*} value - Новое значение
   */
  export function setConfigValue(path, value) {
    const props = path.split('.');
    let current = currentConfig;
    
    // Проходим по пути до предпоследнего элемента
    for (let i = 0; i < props.length - 1; i++) {
      const prop = props[i];
      
      // Если свойство не существует или не является объектом, создаем его
      if (!current[prop] || typeof current[prop] !== 'object') {
        current[prop] = {};
      }
      
      current = current[prop];
    }
    
    // Устанавливаем значение для последнего элемента пути
    const lastProp = props[props.length - 1];
    current[lastProp] = value;
    
    return { ...currentConfig };
  }
  
  // Экспортируем интерфейс модуля
  export default {
    initConfig,
    getConfig,
    getConfigValue,
    updateConfig,
    setConfigValue,
    APP_MODES,
    API_SOURCES
  };