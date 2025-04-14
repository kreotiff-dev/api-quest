/**
 * Скрипт миграции для добавления недостающих полей к заданиям в MongoDB
 * 
 * Запуск:
 * node migration-script.js
 */

const mongoose = require('mongoose');
require('./server/models/Task'); // Подключаем модель Task
const Task = mongoose.model('Task');

// Настройки подключения к базе данных
const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/api-quest';

// Функция для подключения к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('🔌 Подключение к MongoDB успешно установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

// Функция для миграции заданий
const migrateTasks = async () => {
  try {
    console.log('🚀 Начинаем миграцию заданий...');
    
    // Получаем все задания
    const tasks = await Task.find({});
    console.log(`📊 Найдено ${tasks.length} заданий для обновления`);
    
    // Счетчики для статистики
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Проходим по всем заданиям и обновляем их
    for (const task of tasks) {
      try {
        // Задаем полный набор полей независимо от их наличия
        const updates = {
          subtitle: "Основы HTTP запросов",
          category: task.type === 'api' ? 'basics' : (task.type || 'basics'),
          status: "not_started",
          requirements: [
            "Использовать метод GET",
            "URL эндпоинта указан в решении",
            "Не требуется дополнительных заголовков"
          ],
          expectedResult: "Успешный ответ будет иметь статус-код 200 OK и содержать данные в формате JSON.",
          verificationType: 'multiple-choice',
          verificationQuestion: "Проверьте правильность выполнения задания",
          verificationOptions: [
            { value: 'correct', label: 'Запрос выполнен корректно' },
            { value: 'incorrect_url', label: 'Неверный URL запроса' },
            { value: 'incorrect_method', label: 'Неверный метод запроса' }
          ],
          verification_answers: {
            beginnerAnswers: ['correct'],
            advancedAnswerKeywords: []
          }
        };
        
        // Принудительное обновление
        await Task.findByIdAndUpdate(task._id, { $set: updates });
        updatedCount++;
        console.log(`✅ Обновлено задание: ${task.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Ошибка при обновлении задания ${task.title}:`, error);
      }
    }
    
    console.log('\n📝 Результаты миграции:');
    console.log(`📊 Всего заданий: ${tasks.length}`);
    console.log(`✅ Обновлено: ${updatedCount}`);
    console.log(`⏭️ Пропущено: ${skippedCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
    console.log('\n🎉 Миграция завершена!');
  } catch (error) {
    console.error('❌ Ошибка во время миграции:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.connection.close();
    console.log('🔌 Соединение с MongoDB закрыто');
  }
};

// Основная функция
const main = async () => {
  await connectDB();
  await migrateTasks();
  process.exit(0);
};

// Запускаем скрипт
main();