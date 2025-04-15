// Simple script to check the task count in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

// Connect to MongoDB and count tasks
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const moduleId = process.env.MODULE_ID;
      console.log('Connected to MongoDB');
      
      // Count tasks in the module
      const count = await Task.countDocuments({ module: moduleId });
      console.log('Tasks in module ' + moduleId + ': ' + count);
      
      // List tasks
      const tasks = await Task.find({ module: moduleId })
        .select('title order')
        .sort('order');
      
      console.log('\nTasks:');
      tasks.forEach((task, index) => {
        console.log((index + 1) + '. ' + task.title);
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
