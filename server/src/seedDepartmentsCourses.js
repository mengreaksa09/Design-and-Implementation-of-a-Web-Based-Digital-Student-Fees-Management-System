require('dotenv').config();
const db = require('./models');

async function seedDepartmentsAndCourses() {
  try {
    await db.sequelize.sync();

    console.log('Starting departments and courses seeding...\n');

    // Create Departments
    console.log('Creating departments...');
    const departments = [
      {
        code: 'CS',
        name: 'វិទ្យាសាស្ត្រកុំព្យូទ័រ',
        description: 'ដេប៉ាតឺម៉ង់វិទ្យាសាស្ត្រកុំព្យូទ័រ និងបច្ចេកវិទ្យាព័ត៌មាន',
        isActive: true,
      },
      {
        code: 'ENG',
        name: 'វិស្វកម្ម',
        description: 'ដេប៉ាតឺម៉ង់វិស្វកម្ម និងសំណង់ស៊ីវិល',
        isActive: true,
      },
      {
        code: 'BUS',
        name: 'គ្រប់គ្រងពាណិជ្ជកម្ម',
        description: 'ដេប៉ាតឺម៉ង់គ្រប់គ្រង ធុរកិច្ច និងហិរញ្ញវត្ថុ',
        isActive: true,
      },
      {
        code: 'ARCH',
        name: 'ស្ថាបត្យកម្ម',
        description: 'ដេប៉ាតឺម៉ង់ស្ថាបត្យកម្ម និងការរចនាអគារ',
        isActive: true,
      },
      {
        code: 'ELEC',
        name: 'អេឡិចត្រូនិក',
        description: 'ដេប៉ាតឺម៉ង់អេឡិចត្រូនិក និងទូរគមនាគមន៍',
        isActive: true,
      },
    ];

    const createdDepartments = {};
    for (const deptData of departments) {
      let dept = await db.Department.findOne({
        where: { code: deptData.code },
      });

      if (!dept) {
        dept = await db.Department.create(deptData);
        console.log(`✅ Created department: ${deptData.name}`);
      } else {
        // Update it with Khmer name if it already exists
        dept.name = deptData.name;
        dept.description = deptData.description;
        await dept.save();
        console.log(`   Department ${deptData.name} updated/already exists`);
      }
      createdDepartments[deptData.code] = dept;
    }

    // Create Courses
    console.log('\nCreating courses...');
    const courses = [
      // Computer Science Courses
      {
        code: 'CS101',
        name: 'សេចក្តីផ្តើមនៃកម្មវិធីកុំព្យូទ័រ',
        description: 'មូលដ្ឋានគ្រឹះនៃការសរសេរកម្មវិធីដោយប្រើប្រាស់ភាសា Python',
        departmentId: createdDepartments['CS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS201',
        name: 'รចនាសម្ព័ន្ធទិន្នន័យ និងអាលកូរីត',
        description: 'ការយល់ដឹងអំពីប្រភេទរចនាសម្ព័ន្ធទិន្នន័យ និងការរចនាអាលកូរីត',
        departmentId: createdDepartments['CS'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS301',
        name: 'ប្រព័ន្ធគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ',
        description: 'ការរចនា និងការអនុវត្តប្រព័ន្ធគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ SQL/NoSQL',
        departmentId: createdDepartments['CS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS401',
        name: 'ការអភិវឌ្ឍន៍គេហទំព័រ',
        description: 'ការបង្កើតគេហទំព័រពេញលេញ (Full-Stack Web Development)',
        departmentId: createdDepartments['CS'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Engineering Courses
      {
        code: 'ENG101',
        name: 'គណិតវិទ្យាវិស្វកម្ម',
        description: 'មូលដ្ឋានគ្រឹះគណិតវិទ្យាសម្រាប់មុខជំនាញវិស្វកម្ម',
        departmentId: createdDepartments['ENG'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ENG201',
        name: 'មេកានិចវិស្វកម្ម',
        description: 'គោលការណ៍នៃមេកានិច និងចលនាវិទ្យា',
        departmentId: createdDepartments['ENG'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Business Administration Courses
      {
        code: 'BUS101',
        name: 'សេចក្តីផ្តើមនៃធុរកិច្ច',
        description: 'មូលដ្ឋានគ្រឹះនៃការគ្រប់គ្រងធុរកិច្ច និងសហគ្រិនភាព',
        departmentId: createdDepartments['BUS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'BUS201',
        name: 'គោលការណ៍គណនេយ្យ',
        description: 'គណនេយ្យហិរញ្ញវត្ថុ និងគណនេយ្យគ្រប់គ្រងបឋម',
        departmentId: createdDepartments['BUS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Architecture Courses
      {
        code: 'ARCH101',
        name: 'ការរចនាស្ថាបត្យកម្ម I',
        description: 'ការរៀបចំគំនូសប្លង់ និងគោលការណ៍រចនាស្ថាបត្យកម្មបឋម',
        departmentId: createdDepartments['ARCH'].id,
        credits: 4,
        duration: 5,
        level: 'undergraduate',
        isActive: true,
      },
      // Electronics Courses
      {
        code: 'ELEC101',
        name: 'ទ្រឹស្តីសៀគ្វីអគ្គិសនី',
        description: 'ការវិភាគសៀគ្វីអគ្គិសនីជាមូលដ្ឋាន',
        departmentId: createdDepartments['ELEC'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
    ];

    for (const courseData of courses) {
      let existing = await db.Course.findOne({
        where: { code: courseData.code },
      });

      if (!existing) {
        await db.Course.create(courseData);
        console.log(`✅ Created course: ${courseData.name}`);
      } else {
        existing.name = courseData.name;
        existing.description = courseData.description;
        await existing.save();
        console.log(`   Course ${courseData.name} updated/already exists`);
      }
    }

    console.log('\n✅ Departments and courses seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments and courses:', error);
    process.exit(1);
  }
}

seedDepartmentsAndCourses();
