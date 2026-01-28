const db = require('./models');

async function fixStudentDepartments() {
  try {
    await db.sequelize.sync();
    
    console.log('Fetching all students...');
    const students = await db.Student.findAll();
    console.log(`Found ${students.length} students`);
    
    // Get departments
    const departments = await db.Department.findAll();
    const deptNames = departments.map(d => d.name);
    console.log('Available departments:', deptNames);
    
    // Update students with random departments for demo
    const updated = [];
    for (const student of students) {
      const randomDept = deptNames[Math.floor(Math.random() * deptNames.length)];
      await student.update({ department: randomDept });
      updated.push(`${student.studentId}: ${randomDept}`);
    }
    
    console.log('\n✅ Updated all students:');
    updated.forEach(u => console.log(`  - ${u}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixStudentDepartments();
