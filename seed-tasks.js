// Скрипт для миграции заданий из tasks.js в MongoDB
// Запуск: node seed-tasks.js

const mongoose = require('mongoose');
require('dotenv').config();

// Импорт моделей
const Task = require('./server/models/Task');
const Module = require('./server/models/Module');

// ES модули -> CommonJS конвертация
const fs = require('fs');
const path = require('path');

// Чтение файла с заданиями
const tasksFilePath = path.join(__dirname, 'src/data/tasks.js');
const tasksContent = fs.readFileSync(tasksFilePath, 'utf8');

// Преобразование кода ES модуля в CommonJS для выполнения
const tasksCode = tasksContent
  .replace('export const tasks =', 'const tasks =')
  .replace('export function getTaskById', 'function getTaskById')
  .replace('export function getAllTasks', 'function getAllTasks')
  .replace('export function filterTasks', 'function filterTasks')
  .replace('export function getDifficultyText', 'function getDifficultyText')
  .replace('export function getCategoryText', 'function getCategoryText')
  .replace('export function getStatusText', 'function getStatusText')
  .replace('export function getStatusClass', 'function getStatusClass')
  .replace('export default', 'module.exports =');

// Добавление экспорта tasks
const tasksModuleCode = `${tasksCode}\nmodule.exports = { tasks };`;

// Запись временного файла для импорта
const tempFilePath = path.join(__dirname, 'temp-tasks.js');
fs.writeFileSync(tempFilePath, tasksModuleCode);

// Импорт заданий из временного файла
const { tasks } = require('./temp-tasks.js');

// Функция для подключения к MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Логи миграции будут сохранены в этом файле
const logStream = fs.createWriteStream(path.join(__dirname, 'logs/migration.log'), { flags: 'a' });

// Функция логирования
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  logStream.write(logMessage);
};

// Основная функция миграции
const migrateTasksToMongoDB = async () => {
  try {
    // Подключение к базе данных
    await connectDB();
    
    log('Начинаем миграцию заданий...');
    
    // ID первого модуля из БД (для связи заданий с модулем)
    // Найдем его автоматически, если есть в БД
    const firstModule = await Module.findOne().sort({ order: 1 });
    if (!firstModule) {
      log('Ошибка: Не найдено ни одного модуля в БД. Необходимо сначала создать модули.');
      process.exit(1);
    }
    
    const moduleId = firstModule._id;
    log(`Найден модуль для заданий: ${firstModule.title} (ID: ${moduleId})`);

    // Получим ID пользователя-администратора (для поля createdBy)
    // Сначала подключим модель User
    require('./server/models/User');
    const User = mongoose.model('User');
    
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      log('Предупреждение: Не найден пользователь с ролью admin. Используем ID модуля как createdBy.');
      // Используем ID модуля в качестве fallback
      var adminId = moduleId;
    } else {
      var adminId = adminUser._id;
      log(`Найден админ для создания заданий: ${adminUser.name} (ID: ${adminId})`);
    }
    
    // Удаляем существующие задания в модуле перед миграцией,
    // так как возникла ошибка дублирования ключей
    await Task.deleteMany({ module: moduleId });
    log(`Удалены существующие задания для модуля ${moduleId}`);
    
    // Подготовим данные для вставки в БД
    const tasksToInsert = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Создаем объект для вставки в MongoDB
      const mongoTask = {
        title: task.title,
        description: task.description,
        module: moduleId,
        order: i + 1,  // Используем порядковый номер из массива
        difficulty: task.difficulty || 'medium',
        type: 'api',  // По умолчанию тип api
        duration: 15, // По умолчанию 15 минут
        points: 10,   // По умолчанию 10 баллов
        tags: task.tags || [],
        apiSourceRestrictions: task.apiSourceRestrictions || ['mock'],
        solution: {
          method: task.solution?.method || 'GET',
          url: task.solution?.url || '',
          headers: task.solution?.headers || {},
          body: task.solution?.body || null
        },
        expectedResponse: task.expectedResponse ? {
          status: task.expectedResponse.status || 200,
          body: task.expectedResponse.body || {}
        } : null,
        hints: task.hints || [],
        isActive: true,
        isLocked: task.status === 'locked',
        requiresServerResponse: task.requiresServerResponse !== false,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Добавляем задание в массив для вставки
      tasksToInsert.push(mongoTask);
      
      log(`Подготовлено задание "${task.title}" для миграции`);
    }
    
    // Вставляем задания в БД
    const result = await Task.insertMany(tasksToInsert);
    
    log(`Успешно мигрировано ${result.length} заданий`);
    
    // Сохраняем ID импортированных заданий в отдельный файл для справки
    const importedIds = result.map(task => task._id);
    fs.writeFileSync(
      path.join(__dirname, 'logs/imported_task_ids.json'), 
      JSON.stringify({ tasks: importedIds }, null, 2)
    );
    
    log('ID импортированных заданий сохранены в logs/imported_task_ids.json');
    
    // Удаляем временный файл
    fs.unlinkSync(tempFilePath);
    log('Временный файл удален');
    
    log('Миграция заданий успешно завершена');
    
    // Закрываем соединение с MongoDB
    await mongoose.disconnect();
    log('Соединение с MongoDB закрыто');
    
    logStream.end();
    
  } catch (error) {
    log(`Ошибка при миграции заданий: ${error.message}`);
    console.error(error);
    
    // Удаляем временный файл в случае ошибки
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      log('Временный файл удален');
    }
    
    // Закрываем соединение с MongoDB
    await mongoose.disconnect();
    log('Соединение с MongoDB закрыто');
    
    logStream.end();
    process.exit(1);
  }
};

// Запускаем миграцию
migrateTasksToMongoDB();