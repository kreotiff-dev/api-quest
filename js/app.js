// app.js - Главный файл API-Quest, связывающий все модули

// Глобальные переменные
let currentTask = null;
let currentScreen = 'tasks'; // 'tasks' или 'workspace'

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация приложения
    initApp();
});

// Основная функция инициализации приложения
async function initApp() {
    // Загрузка пользовательского прогресса
    ProgressManager.loadUserProgress();
    
    // Инициализация списка заданий
    TaskList.renderTaskList();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Инициализация фильтров
    TaskList.initFilters();
    
    // Инициализация менеджера API источников
    await ApiSourceManager.init();
    
    // Инициализация API клиента
    ApiClient.init();
    
    // Отображаем информацию о приложении в консоли
    console.log('API-Quest инициализирован', {
        версия: '1.1.0',
        режим: getAppMode(),
        источникAPI: ApiSourceManager.getCurrentSourceInfo().name
    });
}

// Определение режима работы приложения
function getAppMode() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'development';
    } else if (location.hostname.includes('staging') || location.hostname.includes('test')) {
        return 'staging';
    } else {
        return 'production';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка открытия документации API
    document.getElementById('open-api-docs').addEventListener('click', UI.openApiDocs);
    
    // Кнопка возврата к списку заданий
    document.getElementById('back-to-tasks').addEventListener('click', () => {
        UI.switchScreen('tasks');
    });
    
    // Обработчик отправки запроса
    document.getElementById('send-request').addEventListener('click', ApiClient.sendApiRequest);
    
    // Кнопка проверки задания
    document.getElementById('check-solution').addEventListener('click', Workspace.checkTaskCompletion);
    
    // Кнопка запроса подсказки
    document.getElementById('open-hints').addEventListener('click', Workspace.getHint);
    
    // Добавление нового заголовка в запрос
    document.getElementById('add-header').addEventListener('click', () => {
        ApiClient.addHeaderRow();
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
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Переключение табов в разделе ответа
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.response-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = `${this.dataset.tab}-response-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Кнопка сброса запроса
    document.getElementById('reset-request').addEventListener('click', ApiClient.resetRequest);
    
    // Кнопка форматирования JSON
    document.getElementById('format-json-btn')?.addEventListener('click', ApiClient.formatJsonBody);
    
    // Обработчики для AI-ассистента
    document.getElementById('ai-help-btn').addEventListener('click', AiAssistant.askHelp);
    document.getElementById('ai-analyze-btn').addEventListener('click', AiAssistant.analyzeRequest);
    document.getElementById('ai-question-send').addEventListener('click', AiAssistant.sendQuestion);
    
    // Обработка клавиши Enter в поле вопроса ассистенту
    document.getElementById('ai-question-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            AiAssistant.sendQuestion();
        }
    });
    
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
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

// Экспортируем глобальные переменные и функции, которые должны быть доступны из других модулей
window.AppMain = {
    getCurrentTask: () => currentTask,
    setCurrentTask: (task) => { currentTask = task; },
    getAppMode: getAppMode
};