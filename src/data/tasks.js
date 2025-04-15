/**
 * Модуль данных заданий API-Quest
 * @module data/tasks
 */

/**
 * Заглушка для совместимости с предыдущей версией
 * Теперь задания хранятся в БД
 * @type {Array<Object>}
 */
export const tasks = [];

/**
 * Получение всех заданий
 * @returns {Array} Массив всех заданий (пустой, так как данные хранятся в БД)
 */
export function getAllTasks() {
  console.log('Вызвана заглушка getAllTasks. В этой версии задания должны загружаться из БД');
  return [];
}

/**
 * Фильтрация заданий по категории и сложности
 * @param {Object} filters - Объект с фильтрами
 * @returns {Array} Отфильтрованный массив заданий
 */
export function filterTasks(filters = {}) {
  // Возвращаем пустой массив, так как данные теперь хранятся в БД
  // и должны фильтроваться на уровне запроса к БД
  console.log('Вызвана заглушка filterTasks. В этой версии фильтрация должна происходить на сервере');
  return [];
}

/**
 * Получение задания по ID
 * @param {number} id ID задания
 * @returns {Object|null} Найденное задание или null
 */
export function getTaskById(id) {
  console.log('Вызвана заглушка getTaskById. В этой версии задания должны загружаться из БД через loadTaskById');
  return null;
}

/**
 * Получает текстовое представление категории задания
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
 * Получает текстовое представление статуса задания
 * @param {string} status - Код статуса
 * @returns {string} Текстовое представление статуса
 */
export function getStatusText(status) {
  switch (status) {
    case 'completed': return 'Выполнено';
    case 'in_progress': return 'В процессе';
    case 'not_started': return 'Не начато';
    default: return 'Неизвестно';
  }
}

/**
 * Получает CSS класс для отображения статуса задания
 * @param {string} status - Код статуса
 * @returns {string} CSS класс
 */
export function getStatusClass(status) {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'in_progress': return 'status-in-progress';
    case 'not_started': return 'status-not-started';
    default: return '';
  }
}

/**
 * Получает текстовое представление сложности задания
 * @param {string} difficulty - Код сложности
 * @returns {string} Текстовое представление сложности
 */
export function getDifficultyText(difficulty) {
  switch (difficulty) {
    case 'easy': return 'Легкое';
    case 'medium': return 'Среднее';
    case 'hard': return 'Сложное';
    default: return 'Неизвестно';
  }
}

/**
 * Загрузка задания из БД
 * @param {number|string} id Идентификатор задания
 * @returns {Promise<Object|null>} Промис с заданием или null
 */
export async function loadTaskById(id) {
  try {
    // Задания теперь загружаются из БД через API
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      return null;
    }
    
    const response = await fetch(`http://localhost:3000/api/tasks/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке задания: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Ошибка при загрузке задания:', error);
    return null;
  }
}

/**
 * Загрузка списка заданий из БД
 * @param {Object} filters Фильтры для поиска заданий
 * @returns {Promise<Array<Object>>} Промис с массивом заданий
 */
export async function loadTasks(filters = {}) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка: отсутствует токен авторизации');
      return [];
    }
    
    // Формируем строку запроса из фильтров
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const url = `http://localhost:3000/api/tasks?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке списка заданий: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Ошибка при загрузке списка заданий:', error);
    return [];
  }
}