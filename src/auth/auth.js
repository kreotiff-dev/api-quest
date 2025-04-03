/**
 * Модуль аутентификации для клиентской части
 * @module auth/auth
 */

import { emit } from '../core/events.js';
import { showNotification } from '../ui/notifications.js';

// URL API для аутентификации
const API_URL = 'http://localhost:3000/api/auth';
const API_BASE_URL = 'http://localhost:3000/api';

// Состояние авторизации
let authState = {
  isAuthenticated: false,
  user: null,
  token: null
};

/**
 * Инициализация модуля аутентификации
 * @returns {Promise<boolean>} Промис, который резолвится в true, если пользователь авторизован
 */
export async function initAuth() {
  // Проверяем наличие токена в localStorage
  const token = localStorage.getItem('token');
  console.log('Инициализация аутентификации. Токен в localStorage:', !!token);
  
  // Добавляем обработчики для форм авторизации
  document.addEventListener('submit', handleAuthForms);
  
  // Обработчик для кнопки выхода
  document.addEventListener('click', function(e) {
    if (e.target.matches('#logout-btn')) {
      e.preventDefault();
      logout();
    }
  });
  
  // Если токена нет, сразу возвращаем false
  if (!token) {
    console.log('Токен отсутствует, пользователь не авторизован');
    return false;
  }
  
  // Устанавливаем токен
  authState.token = token;
  console.log('Токен установлен в authState');
  
  try {
    // Получаем информацию о пользователе и ждем результата
    const user = await getCurrentUser();
    console.log('Пользователь автоматически авторизован:', user);
    console.log('Состояние после авторизации:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user
    });
    
    // Генерируем событие только если пользователь действительно авторизован
    if (authState.isAuthenticated && authState.user) {
      emit('auth:authenticated', authState.user);
    }
    
    return authState.isAuthenticated;
  } catch (error) {
    console.error('Ошибка автоматической авторизации:', error);
    await logout();
    return false;
  }
}

/**
 * Обработка форм авторизации
 * @param {Event} e - Событие отправки формы
 */
function handleAuthForms(e) {
  // Проверяем, что это форма авторизации/регистрации
  if (e.target.matches('#login-form')) {
    e.preventDefault();
    const email = e.target.querySelector('#login-email').value;
    const password = e.target.querySelector('#login-password').value;
    login(email, password);
  } else if (e.target.matches('#register-form')) {
    e.preventDefault();
    const name = e.target.querySelector('#register-name').value;
    const email = e.target.querySelector('#register-email').value;
    const password = e.target.querySelector('#register-password').value;
    register(name, email, password);
  }
}

/**
 * Регистрация нового пользователя
 * @param {string} name - Имя пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль пользователя
 * @returns {Promise} Промис с результатом регистрации
 */
export async function register(name, email, password) {
  try {
    console.log(`Попытка регистрации: ${email}`);
    console.log(`API URL: ${API_URL}/register`);
    
    // Простой запрос на регистрацию
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });
    
    // Получаем данные
    const data = await response.json();
    console.log('Ответ получен:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(data.error || `Ошибка при регистрации (${response.status})`);
    }
    
    // Сохраняем токен
    localStorage.setItem('token', data.token);
    authState.token = data.token;
    
    // Получаем информацию о пользователе
    await getCurrentUser();
    
    // Уведомляем об успешной регистрации
    showNotification('Регистрация успешно завершена', 'success');
    
    // Обновляем состояние авторизации
    authState.isAuthenticated = true;
    
    // Генерируем событие авторизации
    emit('auth:registered', authState.user);
    emit('auth:authenticated', authState.user);
    
    return data;
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    showNotification(`Ошибка при регистрации: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Вход пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль пользователя
 * @returns {Promise} Промис с результатом входа
 */
export async function login(email, password) {
  try {
    console.log(`Попытка входа: ${email}`);
    console.log(`API URL: ${API_URL}/login`);
    
    // Простой запрос на логин
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    // Получаем данные
    const data = await response.json();
    console.log('Ответ получен:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(data.error || `Ошибка при входе (${response.status})`);
    }
    
    // Сохраняем токен
    localStorage.setItem('token', data.token);
    authState.token = data.token;
    
    // Получаем информацию о пользователе
    await getCurrentUser();
    
    // Уведомляем об успешном входе
    showNotification('Вход выполнен успешно', 'success');
    
    // Обновляем состояние авторизации
    authState.isAuthenticated = true;
    
    // Генерируем событие авторизации
    emit('auth:loggedIn', authState.user);
    emit('auth:authenticated', authState.user);
    
    return data;
  } catch (error) {
    console.error('Ошибка при входе:', error);
    showNotification(`Ошибка при входе: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Выход пользователя
 * @returns {Promise} Промис с результатом выхода
 */
export async function logout() {
  try {
    // Делаем запрос к API для выхода (очистки cookie на сервере)
    const response = await fetch(`${API_URL}/logout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });
    
    // Очищаем локальное хранилище
    localStorage.removeItem('token');
    
    // Сбрасываем состояние авторизации
    authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    
    // Уведомляем о выходе
    showNotification('Выход выполнен успешно', 'info');
    
    // Генерируем событие выхода
    emit('auth:loggedOut');
    
    return true;
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    // Даже при ошибке на сервере, мы все равно очищаем локальные данные
    localStorage.removeItem('token');
    authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    showNotification('Выход выполнен', 'info');
    emit('auth:loggedOut');
    return false;
  }
}

/**
 * Получение информации о текущем пользователе
 * @returns {Promise} Промис с информацией о пользователе
 */
export async function getCurrentUser() {
  try {
    console.log('getCurrentUser: запрос данных пользователя');
    
    if (!authState.token) {
      console.log('getCurrentUser: токен отсутствует');
      throw new Error('Токен авторизации отсутствует');
    }
    
    console.log('getCurrentUser: отправка запроса с токеном:', authState.token.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });
    
    console.log('getCurrentUser: ответ получен:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('getCurrentUser: данные:', data);
    
    if (!response.ok) {
      console.log('getCurrentUser: ошибка в ответе');
      throw new Error(data.error || 'Ошибка при получении данных пользователя');
    }
    
    // Обновляем состояние авторизации
    authState.isAuthenticated = true;
    authState.user = data.data;
    console.log('getCurrentUser: состояние обновлено, пользователь авторизован');
    
    return data.data;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    console.log('getCurrentUser: сброс состояния аутентификации из-за ошибки');
    authState.isAuthenticated = false;
    authState.user = null;
    throw error;
  }
}

/**
 * Обновление информации о пользователе
 * @param {Object} userData - Данные пользователя для обновления
 * @returns {Promise} Промис с обновленной информацией о пользователе
 */
export async function updateUserDetails(userData) {
  try {
    if (!authState.token) {
      throw new Error('Токен авторизации отсутствует');
    }
    
    const response = await fetch(`${API_URL}/updatedetails`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при обновлении данных пользователя');
    }
    
    // Обновляем состояние авторизации
    authState.user = data.data;
    
    // Уведомляем об успешном обновлении
    showNotification('Данные пользователя обновлены', 'success');
    
    // Генерируем событие обновления пользователя
    emit('auth:userUpdated', authState.user);
    
    return data.data;
  } catch (error) {
    console.error('Ошибка при обновлении данных пользователя:', error);
    showNotification(`Ошибка при обновлении данных: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Обновление пароля пользователя
 * @param {string} currentPassword - Текущий пароль
 * @param {string} newPassword - Новый пароль
 * @returns {Promise} Промис с результатом обновления пароля
 */
export async function updatePassword(currentPassword, newPassword) {
  try {
    if (!authState.token) {
      throw new Error('Токен авторизации отсутствует');
    }
    
    const response = await fetch(`${API_URL}/updatepassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при обновлении пароля');
    }
    
    // Сохраняем новый токен
    localStorage.setItem('token', data.token);
    authState.token = data.token;
    
    // Уведомляем об успешном обновлении
    showNotification('Пароль успешно обновлен', 'success');
    
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    showNotification(`Ошибка при обновлении пароля: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Получение текущего состояния авторизации
 * @returns {Object} Текущее состояние авторизации
 */
export function getAuthState() {
  return { ...authState };
}

/**
 * Проверка, авторизован ли пользователь
 * @returns {boolean} Статус авторизации
 */
export function isAuthenticated() {
  console.log("Проверка аутентификации:", {
    isAuthenticated: authState.isAuthenticated,
    hasToken: !!authState.token,
    hasUser: !!authState.user
  });
  return authState.isAuthenticated;
}

/**
 * Проверка работоспособности API и MongoDB
 * @returns {Promise<Object>} Результат проверки
 */
export async function checkApiHealth() {
  try {
    // Используем режим no-cors для обхода проблем с CORS при проверке доступности
    const response = await fetch(`${API_BASE_URL}/healthcheck`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit'
    });
    
    console.log('Проверка API:', response.status, response.type);
    
    // В режиме no-cors ответ будет типа "opaque", поэтому мы не можем прочитать его содержимое
    // Но если получили ответ, значит сервер работает
    if (response.type === 'opaque') {
      return { 
        success: true, 
        message: 'API работает, но его ответ недоступен из-за CORS',
        opaque: true
      };
    }
    
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: false, message: 'Пустой ответ' };
    } catch (e) {
      console.error('Ошибка при разборе ответа:', e);
      return { success: true, message: 'API доступен, но вернул некорректный JSON' };
    }
  } catch (error) {
    console.error('Ошибка при проверке API:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'API недоступен, возможно сервер не запущен'
    };
  }
}

export default {
  initAuth,
  register,
  login,
  logout,
  getCurrentUser,
  updateUserDetails,
  updatePassword,
  getAuthState,
  isAuthenticated,
  checkApiHealth
};