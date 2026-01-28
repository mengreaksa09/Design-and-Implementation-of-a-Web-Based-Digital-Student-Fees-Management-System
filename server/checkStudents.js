const db = require('./src/models');

(async () => {
  try {
    await db.sequelize.sync();
    
    const total = await db.Student.count();
    const active = await db.Student.count({ 
      where: { 
        status: { [db.Sequelize.Op.ne]: 'inactive' } 
      } 
    });
    
    console.log('\n=== Student Statistics ===');
    console.log('Total students:', total);
    console.log('Active students:', active);
    console.log('Inactive students:', total - active);
    
    console.log('\n=== Recent Students ===');
    const students = await db.Student.findAll({
      include: [{ 
        model: db.User, 
        as: 'user', 
        attributes: ['email', 'firstName', 'lastName'] 
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    students.forEach(s => {
      console.log(`\nID: ${s.studentId}`);
      console.log(`Name: ${s.user.firstName} ${s.user.lastName}`);
      console.log(`Email: ${s.user.email}`);
      console.log(`Department: ${s.department}`);
      console.log(`Course: ${s.course || 'N/A'}`);
      console.log(`Status: ${s.status}`);
      console.log(`Created: ${s.createdAt}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
