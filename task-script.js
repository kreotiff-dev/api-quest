require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

// Sample tasks
const tasks = [
  {
    title: "API Verification: Missing Field",
    description: "Check if the API response conforms to documentation. The API may be missing a required field.",
    verificationQuestion: "What issue do you see in the API response?",
    verificationOptions: [
      { value: "missing_field", label: "Missing required field" },
      { value: "wrong_status", label: "Wrong status code" },
      { value: "no_issue", label: "No issues found" }
    ],
    verification_answers: {
      beginnerAnswers: ["missing_field"],
      advancedAnswerKeywords: ["missing", "required", "field"]
    }
  },
  {
    title: "API Verification: Wrong Status Code",
    description: "Check if the API response has the correct status code according to documentation.",
    verificationQuestion: "What issue do you see in the API response?",
    verificationOptions: [
      { value: "missing_field", label: "Missing required field" },
      { value: "wrong_status", label: "Wrong status code" },
      { value: "no_issue", label: "No issues found" }
    ],
    verification_answers: {
      beginnerAnswers: ["wrong_status"],
      advancedAnswerKeywords: ["status", "code", "incorrect"]
    }
  },
  {
    title: "API Verification: Valid Response",
    description: "Check if the API response conforms to documentation.",
    verificationQuestion: "Does the API response match the documentation?",
    verificationOptions: [
      { value: "yes", label: "Yes, it matches" },
      { value: "no", label: "No, there are issues" },
    ],
    verification_answers: {
      beginnerAnswers: ["yes"],
      advancedAnswerKeywords: ["correct", "matches", "valid"]
    }
  }
];

async function createTasks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Module and user IDs 
    const moduleId = process.env.MODULE_ID;
    const userId = process.env.USER_ID;
    
    // Delete existing tasks for this module
    const deleteResult = await Task.deleteMany({ module: moduleId });
    console.log(`Deleted ${deleteResult.deletedCount} existing tasks`);
    
    // Create new tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = new Task({
        title: tasks[i].title,
        description: tasks[i].description,
        module: moduleId,
        order: i + 1,
        type: 'api',
        difficulty: 'medium',
        createdBy: userId,
        solution: {
          method: 'GET',
          url: '/api/test',
          headers: {},
          body: null
        },
        expectedResponse: {
          status: 200,
          exactMatch: false,
          body: {}
        },
        apiSourceRestrictions: ['mock'],
        requiresServerResponse: true,
        verificationQuestion: tasks[i].verificationQuestion,
        verificationOptions: tasks[i].verificationOptions,
        verification_answers: tasks[i].verification_answers
      });
      
      const savedTask = await task.save();
      console.log(`Created task: ${savedTask.title}`);
    }
    
    // List all tasks for verification
    const allTasks = await Task.find({ module: moduleId });
    console.log(`\nCreated ${allTasks.length} tasks:`);
    allTasks.forEach(t => console.log(`- ${t.title}`));
    
    // Close connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
}

createTasks();
