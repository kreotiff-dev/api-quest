/**
 * Скрипт для проверки количества заданий в модуле
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

async function countTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB подключена');
    
    // Получаем ID модуля
    const moduleId = process.env.MODULE_ID;
    
    if (\!moduleId) {
      console.error('Ошибка: не указан MODULE_ID в .env файле');
      process.exit(1);
    }
    
    // Подсчитываем задания
    const count = await Task.countDocuments({ module: moduleId });
    console.log("Всего заданий в модуле " + moduleId + ": " + count);
    
    // Получаем список заданий
    const tasks = await Task.find({ module: moduleId }).select('title order').sort('order');
    
    console.log('\nСписок заданий:');
    for (const task of tasks) {
      console.log(task.order + ". " + task.title + " (ID: " + task._id + ")");
    }
    
    // Закрываем соединение
    await mongoose.disconnect();
    console.log('\nСоединение с MongoDB закрыто');
    
  } catch (error) {
    console.error("Ошибка: " + error.message);
    if (mongoose.connection.readyState \!== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Запускаем проверку
countTasks();
