const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Подключение к базе данных MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Эти параметры больше не требуются в новых версиях Mongoose
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false
    });

    logger.info(`MongoDB подключена: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Ошибка подключения к MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };