/**
 * Модуль данных заданий API-Quest
 * @module data/tasks
 */

/**
 * Массив заданий для обучения API
 * @type {Array<Object>}
 */
export const tasks = [
  {
      id: 1,
      title: "Базовый GET запрос",
      subtitle: "Основы HTTP запросов",
      description: "Научитесь создавать простые GET запросы для получения данных с сервера.",
      category: "basics",
      difficulty: "easy",
      status: "not_started",
      tags: ["GET", "Основы"],
      requirements: [
          "Использовать метод GET",
          "URL эндпоинта: /api/users",
          "Не требуется дополнительных заголовков"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать массив пользователей в формате JSON.",
      solution: {
          url: "/api/users",
          method: "GET",
          headers: {},
          body: ""
      }
  },
  {
      id: 2,
      title: "Создание нового пользователя",
      subtitle: "Работа с POST запросами",
      description: "Изучите, как создавать ресурсы на сервере с помощью POST запросов и передачи данных в формате JSON.",
      category: "http",
      difficulty: "medium",
      status: "not_started",
      tags: ["POST", "JSON"],
      requirements: [
          "Использовать метод POST",
          "URL эндпоинта: /api/users",
          "Заголовок Content-Type: application/json",
          "Тело запроса должно содержать JSON-объект со следующими полями:",
          "- name: строка с именем пользователя",
          "- email: строка с корректным email",
          "- role: строка с ролью (admin или user)"
      ],
      expectedResult: "Успешный ответ будет иметь статус-код 201 Created и содержать созданного пользователя с присвоенным id в формате JSON.",
      solution: {
          url: "/api/users",
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: {
              name: true,
              email: true,
              role: true
          }
      }
  },
  // ... остальные задания
];

/**
 * Получение задания по ID
 * @param {number} id - ID задания
 * @returns {Object|null} Задание или null, если не найдено
 */
export function getTaskById(id) {
    return tasks.find(task => task.id === parseInt(id)) || null;
}

/**
 * Получение всех заданий
 * @returns {Array<Object>} Массив заданий
 */
export function getAllTasks() {
    return [...tasks]; // Возвращаем копию массива
}

/**
 * Фильтрация заданий
 * @param {Object} filters - Объект с фильтрами
 * @param {string} [filters.category] - Категория задания
 * @param {string} [filters.difficulty] - Сложность задания
 * @param {string} [filters.status] - Статус задания
 * @param {string} [filters.search] - Поисковый запрос
 * @returns {Array<Object>} Отфильтрованные задания
 */
export function filterTasks(filters) {
    return tasks.filter(task => {
        // Фильтр по категории
        if (filters.category && filters.category !== 'all' && task.category !== filters.category) {
            return false;
        }
        
        // Фильтр по сложности
        if (filters.difficulty && filters.difficulty !== 'all' && task.difficulty !== filters.difficulty) {
            return false;
        }
        
        // Фильтр по статусу
        if (filters.status && filters.status !== 'all' && task.status !== filters.status) {
            return false;
        }
        
        // Поиск по тексту
        if (filters.search) {
            const searchText = filters.search.toLowerCase();
            return (
                task.title.toLowerCase().includes(searchText) ||
                task.description.toLowerCase().includes(searchText) ||
                task.tags.some(tag => tag.toLowerCase().includes(searchText))
            );
        }
        
        return true;
    });
}

/**
 * Получение текста сложности задания
 * @param {string} difficulty - Код сложности (easy, medium, hard)
 * @returns {string} Текстовое представление сложности
 */
export function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return 'Начальный';
        case 'medium': return 'Средний';
        case 'hard': return 'Продвинутый';
        default: return 'Неизвестно';
    }
}

/**
 * Получение текста категории задания
 * @param {string} category - Код категории
 * @returns {string} Текстовое представление категории
 */
export function getCategoryText(category) {
    switch (category) {
        case 'basics': return 'Основы API';
        case 'http': return 'Методы HTTP';
        case 'auth': return 'Аутентификация';
        case 'advanced': return 'Продвинутые техники';
        case 'testing': return 'Тестирование';
        default: return 'Прочее';
    }
}

/**
 * Получение текста статуса задания
 * @param {string} status - Код статуса
 * @returns {string} Текстовое представление статуса
 */
export function getStatusText(status) {
    switch (status) {
        case 'not_started': return 'Не начато';
        case 'in_progress': return 'В процессе';
        case 'completed': return 'Завершено';
        case 'locked': return 'Заблокировано';
        default: return 'Неизвестно';
    }
}

/**
 * Получение класса статуса задания
 * @param {string} status - Код статуса
 * @returns {string} CSS-класс
 */
export function getStatusClass(status) {
    switch (status) {
        case 'not_started': return 'status-not-started';
        case 'in_progress': return 'status-in-progress';
        case 'completed': return 'status-completed';
        case 'locked': return 'status-locked';
        default: return '';
    }
}

export default {
    tasks,
    getTaskById,
    getAllTasks,
    filterTasks,
    getDifficultyText,
    getCategoryText,
    getStatusText,
    getStatusClass
};