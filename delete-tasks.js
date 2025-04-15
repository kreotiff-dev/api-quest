/**
 * Скрипт для удаления существующих заданий из модуля
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

// Настройка MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connecting to MongoDB...');
  
  const moduleId = process.env.MODULE_ID;
  if (moduleId) {
    console.log(`Removing existing tasks for module ${moduleId}`);
    const result = await Task.deleteMany({ module: moduleId });
    console.log(`Deleted ${result.deletedCount} tasks`);
  } else {
    console.log('No MODULE_ID specified in .env file');
  }
  
  // Закрываем соединение
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
