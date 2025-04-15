/**
 * !:@8?B 4;O ?@8<5=5=8O H01;>=>2 ?@>25@>G=KE 2>?@>A>2 : 7040=8O<
 * 
 * 0?CA::
 * node apply-verification-templates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');
const fs = require('fs');

// >4:;NG5=85 : MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB ?>4:;NG5=0...'))
.catch(err => {
  console.error('H81:0 ?>4:;NG5=8O : MongoDB:', err);
  process.exit(1);
});

// 03@C7:0 H01;>=>2 ?@>25@>G=KE 2>?@>A>2
const templates = JSON.parse(fs.readFileSync('verification-templates.json', 'utf8'));

/**
 * ?@545;5=85 :0B53>@88 2>?@>A0 4;O 7040=8O
 * @param {Object} task - 1J5:B 7040=8O
 * @returns {string} - 0B53>@8O 4;O 2K1>@0 H01;>=0
 */
function determineCategory(task) {
  // ?@545;O5< :0B53>@8N =0 >A=>25 <5B>40 87 @5H5=8O
  if (task.solution && task.solution.method) {
    const method = task.solution.method.toUpperCase();
    if (templates[method]) {
      return method;
    }
  }
  
  // @>25@O5< B8? 7040=8O 8 B538
  if (task.tags) {
    if (task.tags.includes('AUTH') || task.tags.includes('authentication') || task.tags.includes('authorization')) {
      return 'AUTH';
    }
    if (task.tags.includes('error-handling') || task.tags.includes('validation')) {
      return 'ERRORS';
    }
    // @>25@O5< HTTP <5B>4K 2 B530E
    for (const tag of task.tags) {
      const uppercaseTag = tag.toUpperCase();
      if (templates[uppercaseTag]) {
        return uppercaseTag;
      }
    }
  }
  
  // > C<>;G0=8N 2>72@0I05< >1ICN :0B53>@8N
  return 'GENERAL';
}

/**
 * K1>@ A;CG09=>3> H01;>=0 87 A>>B25BAB2CNI59 :0B53>@88
 * @param {string} category - 0B53>@8O H01;>=>2
 * @returns {Object} - K1@0==K9 H01;>=
 */
function selectTemplate(category) {
  const categoryTemplates = templates[category] || templates['GENERAL'];
  const randomIndex = Math.floor(Math.random() * categoryTemplates.length);
  return categoryTemplates[randomIndex];
}

/**
 * $C=:F8O 4;O >1=>2;5=8O 7040=89 A H01;>=0<8 ?@>25@>G=KE 2>?@>A>2
 */
const applyTemplates = async () => {
  try {
    // >;CG5=85 7040=89 157 ?@>25@>G=KE 2>?@>A>2
    const tasks = await Task.find({ verificationQuestion: { $exists: false } });
    
    if (tasks.length === 0) {
      console.log('5 =0945=> 7040=89 157 ?@>25@>G=KE 2>?@>A>2');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`0945=> ${tasks.length} 7040=89 157 ?@>25@>G=KE 2>?@>A>2`);
    
    let updatedCount = 0;
    
    for (const task of tasks) {
      // ?@545;O5< :0B53>@8N 4;O 7040=8O
      const category = determineCategory(task);
      
      // K18@05< H01;>=
      const template = selectTemplate(category);
      
      console.log(`@8<5=5=85 H01;>=0 ${category} : 7040=8N "${task.title}"...`);
      
      // @8<5=O5< H01;>= : 7040=8N
      task.verificationQuestion = template.verificationQuestion;
      task.verificationOptions = template.verificationOptions;
      task.verification_answers = template.verification_answers;
      
      // !>E@0=O5< 87<5=5=8O
      await task.save();
      updatedCount++;
      
      console.log(`040=85 "${task.title}" >1=>2;5=> A ?@>25@>G=K<8 2>?@>A0<8`);
    }
    
    console.log(`\n1=>2;5=> ${updatedCount} 87 ${tasks.length} 7040=89`);
    
    // B:;NG5=85 >B 107K 40==KE
    await mongoose.disconnect();
    console.log('MongoDB >B:;NG5=0');
  } catch (error) {
    console.error('H81:0 ?@8 >1=>2;5=88 7040=89:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// 0?CA: >1=>2;5=8O
applyTemplates();