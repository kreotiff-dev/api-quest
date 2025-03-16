// src/tasks/index.js

import eventBus from "../core/events.js";

class TaskList {
    constructor() {
        this.tasks = [];
    }

    loadTasks(taskData) {
        this.tasks = taskData;
        eventBus.emit("tasksLoaded", this.tasks);
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    getAllTasks() {
        return this.tasks;
    }
}

const taskList = new TaskList();
export default taskList;