/**
 * Модуль аутентификации для клиентской части
 * @module auth/auth
 */

import { emit } from '../core/events.js';
import { showNotification } from '../ui/notifications.js';

// URL API для аутентификации
const API_URL = '/api/auth';

// Состояние авторизации
let authState = {
  isAuthenticated: false,
  user: null,
  token: null
};

/**
 * Инициализация модуля аутентификации
 */
export function initAuth() {
  // Проверяем наличие токена в localStorage
  const token = localStorage.getItem('token');
  
  if (token) {
    authState.token = token;
    
    // Получаем информацию о пользователе
    getCurrentUser()
      .then(() => {
        console.log('Пользователь автоматически авторизован');
        emit('auth:authenticated', authState.user);
      })
      .catch(error => {
        console.error('Ошибка автоматической авторизации:', error);
        logout();
      });
  }
  
  // Добавляем обработчики для форм авторизации
  document.addEventListener('submit', handleAuthForms);
  
  // Обработчик для кнопки выхода
  document.addEventListener('click', function(e) {
    if (e.target.matches('#logout-btn')) {
      e.preventDefault();
      logout();
    }
  });
}

/**
 * Обработка форм авторизации
 * @param {Event} e - Событие отправки формы
 */
function handleAuthForms(e) {
  // Проверяем, что это форма авторизации/регистрации
  if (e.target.matches('#login-form')) {
    e.preventDefault();
    const email = e.target.querySelector('#email').value;
    const password = e.target.querySelector('#password').value;
    login(email, password);
  } else if (e.target.matches('#register-form')) {
    e.preventDefault();
    const name = e.target.querySelector('#name').value;
    const email = e.target.querySelector('#email').value;
    const password = e.target.querySelector('#password').value;
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при регистрации');
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при входе');
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
    if (!authState.token) {
      throw new Error('Токен авторизации отсутствует');
    }
    
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при получении данных пользователя');
    }
    
    // Обновляем состояние авторизации
    authState.isAuthenticated = true;
    authState.user = data.data;
    
    return data.data;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
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
  return authState.isAuthenticated;
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
  isAuthenticated
};