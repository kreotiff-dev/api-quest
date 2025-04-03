/**
 * Главный модуль приложения API-Quest
 * @module app
 */

// Импорт модулей API
import * as apiSources from './api/sources/index.js';
import * as apiClient from './api/client/index.js';
import * as logger from './api/monitoring/logger.js';
import * as loggerUI from './api/monitoring/logger-ui.js';
import * as indicator from './api/monitoring/indicator.js';
import verification from './verification/index.js';

// Импорт модулей UI
import * as ui from './ui/index.js';

// Импорт модуля аутентификации
import * as auth from './auth/auth.js';

// Импорт модулей ядра
import * as events from './core/events.js';
import * as config from './core/config.js';
import * as tasks from './core/tasks.js';
import * as taskList from './core/task-list.js';

// Импорт модулей курсов
import courseList from './courses/index.js';
import courseRenderer from './courses/renderer.js';
import courseDetails from './courses/details.js';

// Переменные состояния приложения
let currentTask = null;
let currentScreen = 'tasks';

/**
 * Получение текущего задания
 * @returns {Object|null} Текущее задание или null
 */
export function getCurrentTask() {
    return currentTask;
}

/**
 * Установка текущего задания
 * @param {Object} task - Задание
 */
export function setCurrentTask(task) {
    currentTask = task;
    events.emit('currentTaskChanged', task);
}

/**
 * Получение текущего экрана
 * @returns {string} Имя текущего экрана
 */
export function getCurrentScreen() {
    return currentScreen;
}

/**
 * Переключение текущего экрана
 * @param {string} screen - Имя экрана
 */
export function setCurrentScreen(screen) {
    currentScreen = screen;
    events.emit('screenChanged', screen);
}

/**
 * Определение режима работы приложения
 * @returns {string} Режим работы (development, staging, production)
 */
export function getAppMode() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'development';
    } else if (location.hostname.includes('staging') || location.hostname.includes('test')) {
        return 'staging';
    } else {
        return 'production';
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Обработчики для аутентификации
    setupAuthEventListeners();
    
    // Кнопка открытия документации API
    document.getElementById('open-api-docs')?.addEventListener('click', ui.openApiDocs);
    
    // Кнопка возврата к списку заданий
    document.getElementById('back-to-tasks')?.addEventListener('click', () => {
        ui.switchScreen('tasks');
    });

    // Обработчик отправки запроса
    document.getElementById('send-request')?.addEventListener('click', apiClient.sendApiRequest);
    
    // Кнопка проверки задания
    document.getElementById('check-solution')?.addEventListener('click', tasks.checkTaskCompletion);
    
    // Кнопка запроса подсказки
    document.getElementById('open-hints')?.addEventListener('click', tasks.getHint);
    
    // Добавление нового заголовка в запрос
    document.getElementById('add-header')?.addEventListener('click', () => {
        apiClient.addHeaderRow();
    });
    
    // Переключение табов в API клиенте
    document.querySelectorAll('.api-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех табов
            document.querySelectorAll('.api-tab').forEach(t => t.classList.remove('active'));
            // Скрываем все контенты табов
            document.querySelectorAll('.api-client-tab-content').forEach(c => c.classList.remove('active'));
            
            // Активируем выбранный таб и его контент
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-tab`;
            document.getElementById(tabId)?.classList.add('active');
        });
    });
    
    // Переключение табов в разделе ответа
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.response-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-response-tab`;
            document.getElementById(tabId)?.classList.add('active');
        });
    });
    
    // Обработчики переключения разделов в боковой панели
    document.querySelectorAll('.main-nav li a').forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                ui.switchSection(section);
            }
        });
    });
    
    // Кнопка сброса запроса
    document.getElementById('reset-request')?.addEventListener('click', apiClient.resetRequest);
    
    // Кнопка форматирования JSON
    document.getElementById('format-json-btn')?.addEventListener('click', apiClient.formatJsonBody);
    
    // Обработчики для AI-ассистента
    // Эти обработчики будут добавлены после создания соответствующих модулей
    
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне их содержимого
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Добавление обработчика для клавиши Escape, чтобы закрыть модальные окна
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

/**
 * Настройка обработчиков событий для аутентификации
 */
function setupAuthEventListeners() {
    // Переключение между вкладками авторизации
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            // Скрываем все формы
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            // Активируем выбранную вкладку
            this.classList.add('active');
            
            // Показываем соответствующую форму
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
    
    // Кнопка выхода
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try {
            await auth.logout();
            checkAuthState();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    });
    
    // Обработчик для формы входа
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        updateAuthDebugStatus('Отправка формы входа...', 'info');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            updateAuthDebugStatus('Заполните все поля формы', 'error');
            return;
        }
        
        try {
            updateAuthDebugStatus(`Вход для ${email}...`, 'info');
            await auth.login(email, password);
            updateAuthDebugStatus('Вход успешен, обновление состояния', 'success');
            checkAuthState();
        } catch (error) {
            console.error('Ошибка при входе:', error);
            updateAuthDebugStatus(`Ошибка: ${error.message}`, 'error');
        }
    });
    
    // Обработчик для формы регистрации
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        updateAuthDebugStatus('Отправка формы регистрации...', 'info');
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!name || !email || !password) {
            updateAuthDebugStatus('Заполните все поля формы', 'error');
            return;
        }
        
        if (password.length < 6) {
            updateAuthDebugStatus('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            updateAuthDebugStatus(`Регистрация ${email}...`, 'info');
            await auth.register(name, email, password);
            updateAuthDebugStatus('Регистрация успешна, обновление состояния', 'success');
            checkAuthState();
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            updateAuthDebugStatus(`Ошибка: ${error.message}`, 'error');
        }
    });
    
    // Подписываемся на события аутентификации
    events.on('auth:authenticated', (user) => {
        console.log('Событие auth:authenticated получено, пользователь:', user);
        updateUserInfo(user);
        
        // Обновляем состояние экрана сразу, без таймаута
        // и используем принудительное обновление
        checkAuthState(true);
    });
    
    events.on('auth:loggedOut', () => {
        console.log('Событие auth:loggedOut получено');
        // Сбрасываем состояние и показываем экран авторизации
        currentScreenState = false;
        showAuthScreen();
    });
}

/**
 * Обновляет статус отладки аутентификации
 * @param {string} status - Статус для отображения
 * @param {string} type - Тип статуса (success, error, info)
 */
function updateAuthDebugStatus(status, type = 'info') {
    const debugElement = document.getElementById('auth-debug-status');
    if (!debugElement) return;
    
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = '#d4edda';
            break;
        case 'error':
            backgroundColor = '#f8d7da';
            break;
        default:
            backgroundColor = '#d1ecf1';
    }
    
    debugElement.style.backgroundColor = backgroundColor;
    debugElement.textContent = status;
}

/**
 * Проверка состояния авторизации и переключение экранов
 */
// Флаг для отслеживания текущего состояния экрана
let currentScreenState = null;

/**
 * Проверка состояния авторизации и переключение экранов
 * @param {boolean} force - Принудительно обновить состояние экрана
 */
function checkAuthState(force = false) {
    // Проверяем наличие токена в localStorage
    const token = localStorage.getItem('token');
    console.log('checkAuthState: проверка состояния аутентификации');
    
    if (token) {
        updateAuthDebugStatus('Токен найден в localStorage', 'info');
        console.log('checkAuthState: Токен в localStorage найден');
    } else {
        updateAuthDebugStatus('Токен отсутствует в localStorage', 'error');
        console.log('checkAuthState: Токен в localStorage отсутствует');
    }
    
    const authenticated = auth.isAuthenticated();
    console.log('checkAuthState: результат auth.isAuthenticated():', authenticated);
    
    // Предотвращаем переключение экрана, если состояние не изменилось
    // Это убирает "моргание" интерфейса при повторных вызовах
    if (currentScreenState === authenticated && !force) {
        console.log(`checkAuthState: состояние не изменилось (${authenticated}), пропускаем переключение экрана`);
        return;
    }
    
    // Запоминаем новое состояние экрана
    currentScreenState = authenticated;
    
    if (authenticated) {
        updateAuthDebugStatus('Пользователь авторизован', 'success');
        console.log('checkAuthState: переключение на главный экран');
        showMainScreen();
        updateUserInfo(auth.getAuthState().user);
    } else {
        updateAuthDebugStatus('Пользователь не авторизован', 'error');
        console.log('checkAuthState: переключение на экран авторизации');
        showAuthScreen();
    }
}

/**
 * Показ экрана авторизации
 */
function showAuthScreen() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('tasks-screen').classList.remove('active');
    document.getElementById('workspace-screen').style.display = 'none';
}

/**
 * Показ основного экрана приложения
 */
function showMainScreen() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('tasks-screen').classList.add('active');
}

/**
 * Обновление информации о пользователе в интерфейсе
 * @param {Object} user - Данные пользователя
 */
function updateUserInfo(user) {
    if (user) {
        // Обновляем имя пользователя
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
    }
}

/**
 * Загрузка и отображение курсов
 */
async function loadCourses() {
    try {
        const courses = await courseList.loadCourses();
        
        const courseProgressMap = {};
        for (const course of courses) {
            try {
                // Получаем прогресс пользователя по каждому курсу
                const progress = await courseList.getCourseProgress(course._id);
                courseProgressMap[course._id] = progress;
            } catch (error) {
                console.error(`Ошибка при получении прогресса курса ${course._id}:`, error);
            }
        }
        
        // Рендерим курсы с данными о прогрессе
        await courseRenderer.renderCourses(courses, courseProgressMap);
        
    } catch (error) {
        console.error('Ошибка при загрузке курсов:', error);
        ui.showNotification('Не удалось загрузить список курсов', 'error');
    }
}

/**
 * Инициализация приложения
 * @returns {Promise<void>}
 */
// Флаг, предотвращающий повторную инициализацию
let isInitialized = false;

export async function init() {
    // Предотвращаем повторную инициализацию
    if (isInitialized) {
        console.log('Приложение уже инициализировано, пропускаем повторную инициализацию');
        return;
    }
    
    console.log('=== Инициализация приложения API-Quest ===');
    isInitialized = true;
    
    try {
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Инициализация модуля аутентификации и ожидание результата
        // Это гарантирует, что authState будет установлен до проверки статуса
        const isAuthenticated = await auth.initAuth();
        console.log('Результат инициализации аутентификации:', isAuthenticated);
        
        // Инициализация модулей
        await apiSources.init();
        apiClient.init();
        logger.init();
        loggerUI.init();
        indicator.init();
        
        // Загрузка задач и прогресса
        await tasks.loadTasks();
        
        // Загрузка курсов
        events.on('auth:authenticated', () => {
            // Загружаем курсы после авторизации
            loadCourses();
        });
        
        // Загружаем курсы при активации вкладки курсов
        events.on('coursesTabActivated', () => {
            console.log('Обработка события активации вкладки курсов');
            // Перезагружаем курсы при необходимости
            if (courseList.courses.length === 0) {
                loadCourses();
            }
            
            // Показываем контейнер с курсами
            const coursesContainer = document.getElementById('courses-container');
            if (coursesContainer) {
                coursesContainer.style.display = 'grid';
            }
        });
        
        // Обработка события просмотра деталей курса
        events.on('viewCourseDetails', async (courseId) => {
            console.log(`Просмотр деталей курса: ${courseId}`);
            
            // Переключаемся на экран деталей курса
            ui.switchSection('course-details');
            
            // Загружаем детали курса
            await courseDetails.loadCourse(courseId);
        });
        
        // Обработка события возврата к списку курсов
        events.on('backToCoursesList', () => {
            console.log('Возврат к списку курсов');
            ui.switchSection('courses');
        });
        
        // Если пользователь уже авторизован, загружаем курсы
        if (isAuthenticated) {
            loadCourses();
        }
        
        // Инициализация UI
        ui.init();
        
        // Инициализация фильтров списка заданий
        taskList.initFilters();
        
        // Ручной вызов отрисовки списка заданий
        taskList.renderTaskList();
        
        // Проверка состояния авторизации теперь безопасна,
        // т.к. мы дождались результата auth.initAuth()
        checkAuthState();
        
        // Отображаем информацию о приложении в консоли
        console.log('API-Quest инициализирован', {
            версия: config.VERSION,
            режим: getAppMode(),
            источникAPI: apiSources.getCurrentSourceInfo().name,
            авторизация: auth.isAuthenticated() ? 'выполнена' : 'не выполнена'
        });

        // Временно отключаем верификацию, так как она вызывает ошибки
        // verification.initVerificationTab();
        
        // Генерируем событие инициализации
        events.emit('appInitialized');

        
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
        // В случае ошибки показываем уведомление
        ui.showNotification('Произошла ошибка при инициализации приложения', 'error');
    }
}

// Экспорт для обратной совместимости со старым кодом
window.AppMain = {
    getCurrentTask,
    setCurrentTask,
    getAppMode
};

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', init);