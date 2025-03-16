// src/tasks/index.js
import eventBus from "../core/events.js";

class TaskList {
  constructor() {
    this.tasks = [];
  }
  
  loadTasks(taskData) {
    if (!Array.isArray(taskData)) {
      console.error('Ошибка загрузки заданий: неверный формат данных', taskData);
      return;
    }
    
    this.tasks = taskData;
    console.log(`TaskList: загружено ${this.tasks.length} заданий`);
    eventBus.emit("tasksLoaded", this.tasks);
  }
  
  getTaskById(id) {
    const parsedId = parseInt(id, 10);
    return this.tasks.find(task => task.id === parsedId) || null;
  }
  
  getAllTasks() {
    return [...this.tasks]; // Возвращаем копию массива
  }
}

const taskList = new TaskList();
export default taskList;