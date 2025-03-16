/**
 * Модуль для работы с уведомлениями
 * @module ui/notifications
 */

/**
 * Отображение уведомления
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления (info, success, warning, error)
 */
export function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Находим или создаем контейнер для уведомлений
    let notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications-container';
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    // Добавляем уведомление в контейнер
    notificationsContainer.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500); // Время анимации исчезновения
    }, 5000);
}