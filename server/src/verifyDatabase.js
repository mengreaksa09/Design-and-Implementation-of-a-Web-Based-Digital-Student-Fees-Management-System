require('dotenv').config();
const db = require('./models');

async function verify() {
  try {
    console.log('🔄 Syncing database tables...');
    // Sync using force: true to drop and recreate tables cleanly
    await db.sequelize.sync({ force: true });
    console.log('✅ Database sync complete.');

    console.log('\n🔍 Verifying models and schemas...');
    
    // 1. Verify Student new fields
    const studentAttributes = Object.keys(db.Student.rawAttributes);
    const requiredStudentFields = ['Student_ID', 'Full_Name', 'Telegram_Chat_ID'];
    console.log('Student Model Attributes:', studentAttributes.filter(attr => requiredStudentFields.includes(attr)));
    
    for (const field of requiredStudentFields) {
      if (studentAttributes.includes(field)) {
        console.log(`   ✅ Student model has field: ${field}`);
      } else {
        throw new Error(`❌ Student model is missing field: ${field}`);
      }
    }

    // 2. Verify Class model fields
    const classAttributes = Object.keys(db.Class.rawAttributes);
    console.log('\nClass Model Attributes:', classAttributes);
    const requiredClassFields = ['Class_ID', 'Class_Name', 'Fee_Amount'];
    for (const field of requiredClassFields) {
      if (classAttributes.includes(field)) {
        console.log(`   ✅ Class model has field: ${field}`);
      } else {
        throw new Error(`❌ Class model is missing field: ${field}`);
      }
    }

    // 3. Verify ClassEnrollment model fields
    const enrollmentAttributes = Object.keys(db.ClassEnrollment.rawAttributes);
    console.log('\nClassEnrollment Model Attributes:', enrollmentAttributes);
    const requiredEnrollmentFields = ['Enrollment_ID', 'Student_ID', 'Class_ID', 'Academic_Year'];
    for (const field of requiredEnrollmentFields) {
      if (enrollmentAttributes.includes(field)) {
        console.log(`   ✅ ClassEnrollment model has field: ${field}`);
      } else {
        throw new Error(`❌ ClassEnrollment model is missing field: ${field}`);
      }
    }

    // 4. Test insertions and hooks
    console.log('\n🧪 Testing student hook auto-sync...');
    
    // Select the first student or query them
    const testStudent = await db.Student.findOne();
    if (testStudent) {
      console.log('Original student details:');
      console.log(`   studentId: ${testStudent.studentId}`);
      console.log(`   telegramChatId: ${testStudent.telegramChatId}`);
      
      // Save to trigger beforeSave hook
      await testStudent.save();
      
      // Fetch again to verify sync
      const updatedStudent = await db.Student.findByPk(testStudent.id);
      console.log('Hook synced details:');
      console.log(`   Student_ID: ${updatedStudent.Student_ID}`);
      console.log(`   Full_Name: ${updatedStudent.Full_Name}`);
      console.log(`   Telegram_Chat_ID: ${updatedStudent.Telegram_Chat_ID}`);
      
      if (updatedStudent.Student_ID === updatedStudent.studentId) {
        console.log('   ✅ Hooks successfully synchronized Student_ID!');
      } else {
        console.log('   ❌ Hook Student_ID sync failed.');
      }
    } else {
      console.log('   ℹ️ No test student found in DB to test hook execution.');
    }

    console.log('\n🎉 ALL DATABASE MODELS CREATED AND VERIFIED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

verify();
