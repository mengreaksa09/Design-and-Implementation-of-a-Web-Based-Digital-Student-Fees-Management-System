const db = require('./src/models');

(async () => {
  try {
    await db.sequelize.sync();
    
    // Check the actual table schema
    const [results] = await db.sequelize.query(`
      PRAGMA table_info(students);
    `);
    
    console.log('\n=== Students Table Schema ===');
    results.forEach(col => {
      console.log(`${col.name}: type=${col.type}, notnull=${col.notnull}, dflt_value=${col.dflt_value}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
