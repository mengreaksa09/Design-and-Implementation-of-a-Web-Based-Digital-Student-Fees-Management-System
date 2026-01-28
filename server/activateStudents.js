const db = require('./src/models');

(async () => {
  try {
    await db.sequelize.sync();
    
    // Update all inactive students to active
    const result = await db.Student.update(
      { status: 'active' },
      { 
        where: { 
          status: 'inactive' 
        } 
      }
    );
    
    console.log(`\n✅ Successfully activated ${result[0]} students!`);
    
    // Show updated counts
    const total = await db.Student.count();
    const active = await db.Student.count({ 
      where: { 
        status: { [db.Sequelize.Op.ne]: 'inactive' } 
      } 
    });
    
    console.log(`\nTotal students: ${total}`);
    console.log(`Active students: ${active}`);
    console.log(`Inactive students: ${total - active}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
