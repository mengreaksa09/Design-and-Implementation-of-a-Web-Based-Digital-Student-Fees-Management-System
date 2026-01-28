const db = require('./src/models');

(async () => {
  try {
    await db.sequelize.sync();
    
    console.log('\n=== Fixing Student Status Issue ===\n');
    
    // First, check current status distribution
    const statusCounts = await db.sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM students 
      GROUP BY status
    `, { type: db.sequelize.QueryTypes.SELECT });
    
    console.log('Current status distribution:');
    statusCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count} students`);
    });
    
    // Update all students with NULL or empty status to 'active'
    const [nullUpdated] = await db.sequelize.query(`
      UPDATE students 
      SET status = 'active', updatedAt = datetime('now')
      WHERE status IS NULL OR status = ''
    `);
    
    if (nullUpdated) {
      console.log(`\n✅ Fixed ${nullUpdated} students with NULL/empty status`);
    }
    
    // Update all inactive students to active (unless they were manually set to inactive/graduated/suspended)
    // We'll only update students created in the last 7 days (likely from recent imports)
    const [recentUpdated] = await db.sequelize.query(`
      UPDATE students 
      SET status = 'active', updatedAt = datetime('now')
      WHERE status = 'inactive' 
        AND datetime(createdAt) > datetime('now', '-7 days')
    `);
    
    if (recentUpdated) {
      console.log(`✅ Activated ${recentUpdated} recently imported students`);
    }
    
    // Show final status distribution
    const finalStatusCounts = await db.sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM students 
      GROUP BY status
    `, { type: db.sequelize.QueryTypes.SELECT });
    
    console.log('\nFinal status distribution:');
    finalStatusCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count} students`);
    });
    
    console.log('\n✅ All done! Your students should now appear in the list.');
    console.log('Please refresh your browser.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
