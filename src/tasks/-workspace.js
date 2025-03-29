// src/tasks/workspace.js

import progressManager from "../storage/progress.js";
import eventBus from "../core/events.js";

class Workspace {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentTask = null;
    }

    loadTask(task) {
        if (!this.container) {
            console.error("Контейнер рабочей области не найден.");
            return;
        }

        this.currentTask = task;
        this.container.innerHTML = `
            <h2>${task.title}</h2>
            <p>${task.description}</p>
            <textarea id="task-input" placeholder="Введите запрос..."></textarea>
            <button id="submit-task">Отправить</button>
        `;

        document.getElementById("submit-task").addEventListener("click", () => this.submitTask());
    }

    submitTask() {
        const input = document.getElementById("task-input").value;
        if (!input.trim()) {
            alert("Введите запрос перед отправкой.");
            return;
        }

        console.log("Отправленный запрос:", input);
        progressManager.updateTaskStatus(this.currentTask.id, "in_progress");
        eventBus.emit("taskSubmitted", { task: this.currentTask, input });
    }
}

const workspace = new Workspace("workspace-container");
export default workspace;
