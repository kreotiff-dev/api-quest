/**
 * !:@8?B 4;O 4>102;5=8O ?@>25@>G=KE 2>?@>A>2 : 7040=8O<
 * 
 * 0?CA::
 * node seed-verification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./server/models/Task');

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

// @8<5@K ?@>25@>G=KE 2>?@>A>2 4;O @07=KE B8?>2 7040=89
const verificationData = [
  {
    taskId: '67eedfea4fc2e212d196c20a', // 0<5=8B5 =0 @50;L=K9 ID 7040=8O
    verificationQuestion: '0:85 =5A>>B25BAB28O 2 AB@C:BC@5 >B25B0 5ABL 8AE>4O 87 4>:C<5=B0F88 API?',
    verificationOptions: [
      { value: 'missing-fields', label: 'BACBAB2C5B ?>;5 age, :>B>@>5 4>;6=> 1KBL A>3;0A=> 4>:C<5=B0F88' },
      { value: 'empty-fields', label: 'CABK5 7=0G5=8O ?>;59 name, email 8 role' },
      { value: 'wrong-status', label: '525@=K9 AB0BCA-:>4 >B25B0' },
      { value: 'extra-field', label: '8H=55 ?>;5 createdAt, =5 C:070==>5 2 4>:C<5=B0F88' },
      { value: 'wrong-format', label: '525@=K9 D>@<0B 40==KE 2 ?>;OE' }
    ],
    verification_answers: {
      beginnerAnswers: ['empty-fields', 'extra-field'],
      advancedAnswerKeywords: ['?CABK5 ?>;O', '7=0G5=8O =5 70?>;=5=K', 'createdAt', ';8H=55 ?>;5']
    }
  },
  {
    taskId: '67eedfea4fc2e212d196c20b', // 0<5=8B5 =0 @50;L=K9 ID 7040=8O
    verificationQuestion: '0:85 ?@>1;5<K A 02B>@870F859 ?@8ACBAB2CNB 2 40==>< API?',
    verificationOptions: [
      { value: 'missing-token', label: 'BACBAB2C5B B>:5= 02B>@870F88' },
      { value: 'expired-token', label: '">:5= 02B>@870F88 8AB5:' },
      { value: 'invalid-scope', label: '54>AB0B>G=> ?@02 4;O 2K?>;=5=8O >?5@0F88' },
      { value: 'wrong-auth-method', label: 'A?>;L7C5BAO =525@=K9 <5B>4 02B>@870F88' },
      { value: 'auth-bypass', label: '>7<>65= >1E>4 02B>@870F88' }
    ],
    verification_answers: {
      beginnerAnswers: ['missing-token', 'wrong-auth-method'],
      advancedAnswerKeywords: ['>BACBAB2C5B B>:5=', '=5 C:070= B>:5=', '=525@=K9 <5B>4 02B>@870F88', 'Basic 2<5AB> Bearer']
    }
  },
  {
    taskId: '67eedfea4fc2e212d196c20c', // 0<5=8B5 =0 @50;L=K9 ID 7040=8O
    verificationQuestion: '0:85 >H81:8 ?@8ACBAB2CNB 2 AB0BCA-:>40E >B25B>2 API?',
    verificationOptions: [
      { value: '200-for-error', label: '>4 200 OK 8A?>;L7C5BAO 4;O >H81>:' },
      { value: '404-for-empty', label: '>4 404 8A?>;L7C5BAO 4;O ?CABKE @57C;LB0B>2 ?>8A:0' },
      { value: '500-for-validation', label: '>4 500 8A?>;L7C5BAO 4;O >H81>: 20;840F88' },
      { value: 'wrong-redirect', label: '525@=K9 :>4 ?5@5=0?@02;5=8O' },
      { value: 'success-inconsistency', label: '5?>A;54>20B5;L=>ABL 2 2>72@0I05<KE :>40E CA?5E0' }
    ],
    verification_answers: {
      beginnerAnswers: ['200-for-error', '500-for-validation'],
      advancedAnswerKeywords: ['200 4;O >H81>:', 'A5@25@=0O >H81:0 4;O 20;840F88', '=525@=K5 :>4K AB0BCA0']
    }
  }
];

// $C=:F8O 4;O >1=>2;5=8O 7040=89
const updateTasksWithVerification = async () => {
  try {
    let updatedCount = 0;

    for (const data of verificationData) {
      // 09B8 7040=85 ?> ID
      const task = await Task.findById(data.taskId);
      
      if (!task) {
        console.log(`040=85 A ID ${data.taskId} =5 =0945=>, ?@>?CA:05<`);
        continue;
      }
      
      // 1=>28BL 7040=85 A ?@>25@>G=K<8 2>?@>A0<8
      task.verificationQuestion = data.verificationQuestion;
      task.verificationOptions = data.verificationOptions;
      task.verification_answers = data.verification_answers;
      
      // !>E@0=8BL 87<5=5=8O
      await task.save();
      updatedCount++;
      console.log(`040=85 "${task.title}" >1=>2;5=> A ?@>25@>G=K<8 2>?@>A0<8`);
    }

    console.log(`\n1=>2;5=> ${updatedCount} 87 ${verificationData.length} 7040=89`);
    
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
updateTasksWithVerification();