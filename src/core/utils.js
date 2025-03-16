/**
 * Модуль общих утилит API-Quest
 * Содержит вспомогательные функции, используемые различными модулями приложения
 */

/**
 * Дебаунс функции (задержка вызова до истечения таймаута)
 * @param {Function} fn - Исходная функция
 * @param {number} delay - Задержка в миллисекундах
 * @return {Function} Дебаунсированная функция
 */
export function debounce(fn, delay) {
    let timerId;
    
    return function(...args) {
      const context = this;
      
      clearTimeout(timerId);
      
      timerId = setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    };
  }
  
  /**
   * Троттлинг функции (вызов не чаще заданного интервала)
   * @param {Function} fn - Исходная функция
   * @param {number} limit - Интервал в миллисекундах
   * @return {Function} Функция с троттлингом
   */
  export function throttle(fn, limit) {
    let lastCall = 0;
    
    return function(...args) {
      const now = Date.now();
      
      if (now - lastCall >= limit) {
        lastCall = now;
        fn.apply(this, args);
      }
    };
  }
  
  /**
   * Форматирование даты
   * @param {Date|string|number} date - Дата для форматирования
   * @param {string} format - Формат (short, long, time, datetime, iso)
   * @param {string} locale - Локаль (по умолчанию ru-RU)
   * @return {string} Форматированная дата
   */
  export function formatDate(date, format = 'short', locale = 'ru-RU') {
    if (!date) return '';
    
    const dateObj = typeof date === 'object' ? date : new Date(date);
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale);
      case 'long':
        return dateObj.toLocaleDateString(locale, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return dateObj.toLocaleTimeString(locale);
      case 'datetime':
        return dateObj.toLocaleString(locale);
      case 'iso':
        return dateObj.toISOString();
      default:
        return dateObj.toLocaleString(locale);
    }
  }
  
  /**
   * Форматирование числа
   * @param {number} num - Число для форматирования
   * @param {Object} options - Опции форматирования
   * @param {string} locale - Локаль (по умолчанию ru-RU)
   * @return {string} Форматированное число
   */
  export function formatNumber(num, options = {}, locale = 'ru-RU') {
    return new Intl.NumberFormat(locale, options).format(num);
  }
  
  /**
   * Генерация уникального ID
   * @param {string} prefix - Префикс для ID
   * @return {string} Уникальный ID
   */
  export function generateId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Глубокое клонирование объекта
   * @param {Object} obj - Исходный объект
   * @return {Object} Клонированный объект
   */
  export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Для обработки Date
    if (obj instanceof Date) {
      return new Date(obj);
    }
    
    // Для обработки Array
    if (Array.isArray(obj)) {
      return obj.map(item => deepClone(item));
    }
    
    // Для обработки Object
    const clone = {};
    Object.keys(obj).forEach(key => {
      clone[key] = deepClone(obj[key]);
    });
    
    return clone;
  }
  
  /**
   * Задержка на указанное количество миллисекунд
   * @param {number} ms - Время задержки в миллисекундах
   * @return {Promise} Промис, который разрешится после задержки
   */
  export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Форматирование времени в человекочитаемый формат
   * @param {number} ms - Время в миллисекундах
   * @return {string} Форматированное время
   */
  export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} ч ${minutes % 60} мин`;
    }
    
    if (minutes > 0) {
      return `${minutes} мин ${seconds % 60} сек`;
    }
    
    return `${seconds} сек`;
  }
  
  /**
   * Обрезка текста до указанной длины с добавлением многоточия
   * @param {string} text - Исходный текст
   * @param {number} maxLength - Максимальная длина
   * @return {string} Обрезанный текст
   */
  export function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substr(0, maxLength) + '...';
  }
  
  /**
   * Проверка является ли объект пустым
   * @param {Object} obj - Проверяемый объект
   * @return {boolean} True, если объект пуст
   */
  export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }
  
  /**
   * Преобразование объекта в строку параметров URL
   * @param {Object} params - Объект с параметрами
   * @return {string} Строка параметров URL
   */
  export function objectToQueryString(params) {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
  
  /**
   * Анализ строки параметров URL и преобразование в объект
   * @param {string} queryString - Строка параметров URL
   * @return {Object} Объект с параметрами
   */
  export function queryStringToObject(queryString) {
    if (!queryString || queryString === '?') {
      return {};
    }
    
    // Убираем начальный символ '?', если он есть
    const query = queryString.startsWith('?') ? queryString.substring(1) : queryString;
    
    return query.split('&').reduce((params, param) => {
      const [key, value] = param.split('=');
      
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
      
      return params;
    }, {});
  }
  
  /**
   * Безопасное выполнение JSON.parse с обработкой ошибок
   * @param {string} jsonString - JSON строка
   * @param {*} defaultValue - Значение по умолчанию при ошибке
   * @return {*} Распарсенный объект или значение по умолчанию
   */
  export function safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return defaultValue;
    }
  }
  
  /**
   * Безопасное сохранение в localStorage с обработкой ошибок
   * @param {string} key - Ключ для сохранения
   * @param {*} value - Значение для сохранения
   * @return {boolean} Успешность операции
   */
  export function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  /**
   * Безопасное получение из localStorage с обработкой ошибок
   * @param {string} key - Ключ для получения
   * @param {*} defaultValue - Значение по умолчанию при ошибке
   * @return {*} Полученное значение или значение по умолчанию
   */
  export function safeLocalStorageGet(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }
  
  /**
   * Преобразование строки в PascalCase
   * @param {string} str - Исходная строка
   * @return {string} Строка в PascalCase
   */
  export function toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, char => char.toUpperCase());
  }
  
  /**
   * Преобразование строки в camelCase
   * @param {string} str - Исходная строка
   * @return {string} Строка в camelCase
   */
  export function toCamelCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }
  
  /**
   * Преобразование строки в kebab-case
   * @param {string} str - Исходная строка
   * @return {string} Строка в kebab-case
   */
  export function toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  // Экспортируем все утилиты как объект по умолчанию
  export default {
    debounce,
    throttle,
    formatDate,
    formatNumber,
    generateId,
    deepClone,
    delay,
    formatDuration,
    truncateText,
    isEmptyObject,
    objectToQueryString,
    queryStringToObject,
    safeJsonParse,
    safeLocalStorageSet,
    safeLocalStorageGet,
    toPascalCase,
    toCamelCase,
    toKebabCase
  };