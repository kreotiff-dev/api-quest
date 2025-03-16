/**
 * Конфигурация источников API
 * @module api/sources/config
 */

/**
 * Конфигурация доступных API источников
 */
export const apiSourceConfig = {
  mock: {
      name: "Симулятор API",
      description: "Локальные моки для обучения без внешних зависимостей",
      baseUrl: "" // Пустой URL для моков
  },
  public: {
      name: "Публичные API",
      description: "Набор бесплатных публичных API для практики",
      baseUrl: "https://jsonplaceholder.typicode.com" // JSONPlaceholder API
  },
  custom: {
      name: "Учебный API",
      description: "Собственный API платформы с расширенными возможностями",
      baseUrl: "https://api-quest.example.com/api"
  }
};

/**
* Начальное состояние источников API
*/
export const defaultSourceState = {
  mock: {
      isAvailable: true, // Моки всегда доступны
      priority: 1        // Высший приоритет для образовательных целей
  },
  public: {
      isAvailable: false, // Будет проверено при инициализации
      priority: 2         // Средний приоритет
  },
  custom: {
      isAvailable: false, // Будет проверено при инициализации
      priority: 3         // Низкий приоритет (используется при доступности)
  }
};

/**
* Ключ для хранения выбранного источника API в localStorage
*/
export const STORAGE_KEY = 'apiQuestSelectedSource';