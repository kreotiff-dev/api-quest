// Функция для обработки ссылок в левом сайдбаре
function setupSidebarLinks() {
  // Находим все ссылки на эндпоинты в левом сайдбаре
  const sidebarLinks = document.querySelectorAll('.nav-list a, .sidebar-endpoints a');
  
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Предотвращаем переход по ссылке
      
      // Получаем атрибут href или data-target ссылки
      const targetId = this.getAttribute('href') || this.getAttribute('data-target');
      
      // Если ссылка указывает на эндпоинт в текущей странице
      if (targetId && targetId.startsWith('#')) {
        // Находим соответствующий эндпоинт
        const targetEndpoint = document.querySelector(targetId);
        
        if (targetEndpoint) {
          // Находим и открываем заголовок эндпоинта
          const header = targetEndpoint.querySelector('.endpoint-header');
          if (header) {
            // Эмулируем клик, чтобы открыть/развернуть детали
            header.click();
            
            // Прокручиваем к эндпоинту
            targetEndpoint.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
      // Если ссылка указывает на другую страницу
      else if (targetId) {
        window.location.href = targetId;
      }
    });
  });
}

// Также добавим функционал для прямых кликов по элементам списка сайдбара,
// если они не обернуты в теги <a>
function setupSidebarItems() {
  const sidebarItems = document.querySelectorAll('.sidebar-endpoints .endpoint-item');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      // Получаем целевой эндпоинт из data-атрибута
      const targetEndpoint = this.getAttribute('data-endpoint');
      
      if (targetEndpoint) {
        // Находим элемент с этим ID в основном содержимом
        const endpoint = document.getElementById(targetEndpoint);
        
        if (endpoint) {
          // Открываем детали эндпоинта
          const header = endpoint.querySelector('.endpoint-header');
          if (header) {
            header.click();
            endpoint.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });
}

// Вызываем функции настройки после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  setupSidebarLinks();
  setupSidebarItems();
});