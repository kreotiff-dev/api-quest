// src/storage/logs.js

class LogStorage {
  constructor() {
      this.logsKey = "appLogs";
      this.logs = this.loadLogs();
  }

  loadLogs() {
      const savedLogs = localStorage.getItem(this.logsKey);
      return savedLogs ? JSON.parse(savedLogs) : [];
  }

  saveLogs() {
      localStorage.setItem(this.logsKey, JSON.stringify(this.logs));
  }

  addLog(entry) {
      this.logs.push({
          timestamp: new Date().toISOString(),
          ...entry
      });
      this.saveLogs();
  }

  getLogs() {
      return this.logs;
  }

  clearLogs() {
      this.logs = [];
      this.saveLogs();
  }
}

const logStorage = new LogStorage();
export default logStorage;