// src/storage/progress.js

class ProgressManager {
  constructor() {
      this.progressKey = "userProgress";
      this.progress = this.loadProgress();
  }

  loadProgress() {
      const savedProgress = localStorage.getItem(this.progressKey);
      return savedProgress ? JSON.parse(savedProgress) : { taskStatuses: {} };
  }

  saveProgress() {
      localStorage.setItem(this.progressKey, JSON.stringify(this.progress));
  }

  updateTaskStatus(taskId, status) {
      this.progress.taskStatuses[taskId] = status;
      this.saveProgress();
  }

  getTaskStatus(taskId) {
      return this.progress.taskStatuses[taskId] || "not_started";
  }

  updateCourseProgress() {
      const totalTasks = Object.keys(this.progress.taskStatuses).length;
      const completedTasks = Object.values(this.progress.taskStatuses).filter(status => status === "completed").length;
      
      return totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  resetProgress() {
      this.progress = { taskStatuses: {} };
      this.saveProgress();
  }
}

const progressManager = new ProgressManager();
export default progressManager;
