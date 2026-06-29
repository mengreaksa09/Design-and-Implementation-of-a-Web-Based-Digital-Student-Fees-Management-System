const db = require('./src/models');

(async () => {
  try {
    await db.sequelize.sync();
    
    const targetId = '7117a470-2029-4007-a21a-33af0a9d7739';
    
    // Check if it exists in users
    const user = await db.User.findByPk(targetId);
    console.log('User found:', user ? user.toJSON() : 'No');
    
    // Check if it exists in students
    const student = await db.Student.findByPk(targetId);
    console.log('Student found by PK:', student ? student.toJSON() : 'No');
    
    // Check if it is a userId in students
    const studentByUserId = await db.Student.findOne({ where: { userId: targetId } });
    console.log('Student found by userId:', studentByUserId ? studentByUserId.toJSON() : 'No');
    
    // Check if any studentId matches targetId
    const studentByStudentId = await db.Student.findOne({ where: { studentId: targetId } });
    console.log('Student found by studentId field:', studentByStudentId ? studentByStudentId.toJSON() : 'No');
    
    // Let's print the associations of FeeAssignment
    console.log('\n=== FeeAssignment Associations ===');
    Object.keys(db.FeeAssignment.associations).forEach(key => {
      const assoc = db.FeeAssignment.associations[key];
      console.log(`${key}: type=${assoc.associationType}, foreignKey=${assoc.foreignKey}, targetKey=${assoc.targetKey}`);
    });
    
    // Let's print the associations of Student
    console.log('\n=== Student Associations ===');
    Object.keys(db.Student.associations).forEach(key => {
      const assoc = db.Student.associations[key];
      console.log(`${key}: type=${assoc.associationType}, foreignKey=${assoc.foreignKey}, targetKey=${assoc.targetKey}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
