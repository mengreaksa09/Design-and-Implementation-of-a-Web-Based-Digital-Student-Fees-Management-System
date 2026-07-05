require('dotenv').config();
const db = require('./models');

async function swapNames() {
  try {
    await db.sequelize.sync();
    const users = await db.User.findAll({ where: { role: 'student' }});

    let updatedCount = 0;

    for (const user of users) {
      if (user.firstName && user.lastName) {
        // Swap firstName and lastName
        const oldFirst = user.firstName;
        const oldLast = user.lastName;

        // Ensure we only swap if it's currently Khmer (meaning we already translated it but left it in English order)
        const isKhmer = /[\u1780-\u17FF]/.test(oldFirst || '');
        if (isKhmer) {
          await user.update({
            firstName: oldLast,
            lastName: oldFirst
          }, { hooks: false });
          updatedCount++;
        }
      }
    }

    console.log(`Successfully swapped names for ${updatedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

swapNames();
