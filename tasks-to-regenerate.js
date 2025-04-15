/**
 * Скрипт для удаления существующих заданий и запуска генерации новых
 */
const { spawn } = require('child_process');
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const moduleId = process.env.MODULE_ID;
    if (\!moduleId) {
      console.error('No MODULE_ID specified in .env file');
      process.exit(1);
    }
    
    // Удаляем существующие задания
    console.log(`Removing existing tasks for module ${moduleId}`);
    const result = await Task.deleteMany({ module: moduleId });
    console.log(`Deleted ${result.deletedCount} tasks`);
    
    // Закрываем соединение с MongoDB
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    // Запускаем скрипт генерации заданий
    console.log('Starting task generation script...');
    const child = spawn('node', ['generate-api-verification-tasks.js'], {
      stdio: 'inherit'
    });
    
    // Автоматически отвечаем "y" на вопрос о продолжении
    setTimeout(() => {
      process.stdin.write('y\n');
    }, 1000);
    
    child.on('close', (code) => {
      console.log(`Task generation process exited with code ${code}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
