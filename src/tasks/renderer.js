// src/tasks/renderer.js

import taskList from "./index.js";

class TaskRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    renderTasks() {
        if (!this.container) {
            console.error("Контейнер для задач не найден.");
            return;
        }
        
        this.container.innerHTML = ""; // Очистка перед рендерингом
        
        const tasks = taskList.getAllTasks();
        tasks.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.className = "task-item";
            taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <button onclick="handleTask(${task.id})">Начать</button>
            `;
            this.container.appendChild(taskElement);
        });
    }
}

const taskRenderer = new TaskRenderer("tasks-container");
export default taskRenderer;

// Функция-обработчик, которая будет вызываться при клике по кнопке задания
function handleTask(taskId) {
    console.log("Выбрано задание ID:", taskId);
    // Здесь можно добавить логику обработки задания
}
