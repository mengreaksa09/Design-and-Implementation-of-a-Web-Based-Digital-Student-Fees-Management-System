require('dotenv').config();
const db = require('./models');

async function fixNames() {
  try {
    await db.sequelize.sync();
    
    // Find all students whose Full_Name is 'ចាន់ សុខ'
    const students = await db.Student.findAll({
      where: {
        Full_Name: 'ចាន់ សុខ'
      },
      include: [{ model: db.User, as: 'user' }]
    });

    let count = 0;
    for (const student of students) {
      // If their actual user name is not 'ចាន់ សុខ', clear it
      if (!(student.user && student.user.firstName === 'ចាន់' && student.user.lastName === 'សុខ')) {
        await student.update({ Full_Name: null }, { hooks: false });
        count++;
      }
    }

    console.log(`Successfully cleared incorrect Full_Name for ${count} students.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixNames();
