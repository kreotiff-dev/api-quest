/**
 * Модуль для управления курсами
 * @module courses/index
 */

import eventBus from "../core/events.js";

// URL API для курсов
const API_URL = 'http://localhost:3000/api/courses';

/**
 * Класс для управления списком курсов
 */
class CourseList {
  /**
   * Создает экземпляр списка курсов
   */
  constructor() {
    this.courses = [];
    this.isLoading = false;
    this.initialized = false;
  }

  /**
   * Загружает список курсов
   * @returns {Promise<Array>} - Промис с массивом курсов
   */
  async loadCourses() {
    if (this.isLoading) {
      return this.courses;
    }

    this.isLoading = true;

    try {
      // Проверяем наличие токена перед запросом
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Ошибка: отсутствует токен авторизации');
        throw new Error('Необходима авторизация');
      }

      console.log(`Отправка запроса на ${API_URL} с токеном:`, token.substring(0, 10) + '...');
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Статус ответа:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Текст ошибки:', errorText);
        throw new Error(`Ошибка при загрузке курсов: ${response.status}`);
      }

      const data = await response.json();
      this.courses = data.data || [];
      
      console.log(`CourseList: загружено ${this.courses.length} курсов`);
      this.initialized = true;
      
      // Сообщаем о загрузке курсов
      eventBus.emit("coursesLoaded", this.courses);
      
      return this.courses;
    } catch (error) {
      console.error('Ошибка при загрузке курсов:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Получает курс по ID
   * @param {string} id - ID курса
   * @returns {Object|null} - Объект курса или null
   */
  getCourseById(id) {
    return this.courses.find(course => course._id === id) || null;
  }
  
  /**
   * Возвращает все курсы
   * @returns {Array} - Копия массива курсов
   */
  getAllCourses() {
    return [...this.courses];
  }
  
  /**
   * Записывается на курс
   * @param {string} courseId - ID курса 
   * @returns {Promise<Object>} - Результат записи
   */
  async enrollInCourse(courseId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Ошибка: отсутствует токен авторизации');
        throw new Error('Необходима авторизация');
      }
      
      const response = await fetch(`${API_URL}/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка при записи на курс: ${response.status}`);
      }

      const data = await response.json();
      
      // Сообщаем о записи на курс
      eventBus.emit("courseEnrolled", { courseId, data: data.data });
      
      return data.data;
    } catch (error) {
      console.error('Ошибка при записи на курс:', error);
      throw error;
    }
  }

  /**
   * Получает прогресс пользователя по курсу
   * @param {string} courseId - ID курса
   * @returns {Promise<Object>} - Данные о прогрессе
   */
  async getCourseProgress(courseId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Ошибка: отсутствует токен авторизации');
        throw new Error('Необходима авторизация');
      }
      
      const response = await fetch(`${API_URL}/${courseId}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка при получении прогресса: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Ошибка при получении прогресса курса:', error);
      throw error;
    }
  }
}

// Экспортируем синглтон
const courseList = new CourseList();
export default courseList;