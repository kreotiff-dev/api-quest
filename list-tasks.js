// Simple script to list all tasks in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log('Connected to MongoDB');
      
      // Get all tasks
      const tasks = await mongoose.connection.db.collection('tasks').find({}).toArray();
      console.log('Total tasks in the database:', tasks.length);
      
      // Group by module
      console.log('\nTask modules:');
      const moduleIds = {};
      tasks.forEach(task => {
        const moduleId = task.module ? task.module.toString() : 'no-module';
        moduleIds[moduleId] = (moduleIds[moduleId] || 0) + 1;
      });
      
      Object.keys(moduleIds).forEach(id => {
        console.log('Module ' + id + ': ' + moduleIds[id] + ' tasks');
      });
      
      // List titles
      console.log('\nTask titles:');
      tasks.forEach(task => {
        console.log('- ' + task.title + ' (Module: ' + (task.module || 'none') + ')');
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      await mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
