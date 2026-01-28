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
        name: 'Computer Science',
        description: 'Department of Computer Science and Information Technology',
        isActive: true,
      },
      {
        code: 'ENG',
        name: 'Engineering',
        description: 'Department of Engineering',
        isActive: true,
      },
      {
        code: 'BUS',
        name: 'Business Administration',
        description: 'Department of Business and Management',
        isActive: true,
      },
      {
        code: 'ARCH',
        name: 'Architecture',
        description: 'Department of Architecture and Design',
        isActive: true,
      },
      {
        code: 'ELEC',
        name: 'Electronics',
        description: 'Department of Electronics and Communication',
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
        console.log(`   Department ${deptData.name} already exists`);
      }
      createdDepartments[deptData.code] = dept;
    }

    // Create Courses
    console.log('\nCreating courses...');
    const courses = [
      // Computer Science Courses
      {
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Fundamentals of programming using Python',
        departmentId: createdDepartments['CS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS201',
        name: 'Data Structures and Algorithms',
        description: 'Core data structures and algorithm design',
        departmentId: createdDepartments['CS'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS301',
        name: 'Database Management Systems',
        description: 'Design and implementation of database systems',
        departmentId: createdDepartments['CS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'CS401',
        name: 'Web Development',
        description: 'Full-stack web application development',
        departmentId: createdDepartments['CS'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Engineering Courses
      {
        code: 'ENG101',
        name: 'Engineering Mathematics',
        description: 'Mathematical foundations for engineering',
        departmentId: createdDepartments['ENG'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ENG201',
        name: 'Mechanics',
        description: 'Principles of mechanics and dynamics',
        departmentId: createdDepartments['ENG'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ENG301',
        name: 'Thermodynamics',
        description: 'Heat transfer and thermodynamic systems',
        departmentId: createdDepartments['ENG'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Business Administration Courses
      {
        code: 'BUS101',
        name: 'Introduction to Business',
        description: 'Fundamentals of business management',
        departmentId: createdDepartments['BUS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'BUS201',
        name: 'Accounting Principles',
        description: 'Financial and managerial accounting basics',
        departmentId: createdDepartments['BUS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'BUS301',
        name: 'Marketing Management',
        description: 'Marketing strategies and consumer behavior',
        departmentId: createdDepartments['BUS'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      // Architecture Courses
      {
        code: 'ARCH101',
        name: 'Architectural Design I',
        description: 'Introduction to architectural design principles',
        departmentId: createdDepartments['ARCH'].id,
        credits: 4,
        duration: 5,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ARCH201',
        name: 'Building Construction',
        description: 'Construction methods and materials',
        departmentId: createdDepartments['ARCH'].id,
        credits: 3,
        duration: 5,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ARCH301',
        name: 'Urban Planning',
        description: 'Principles of urban design and planning',
        departmentId: createdDepartments['ARCH'].id,
        credits: 3,
        duration: 5,
        level: 'undergraduate',
        isActive: true,
      },
      // Electronics Courses
      {
        code: 'ELEC101',
        name: 'Circuit Theory',
        description: 'Basic electrical circuits and analysis',
        departmentId: createdDepartments['ELEC'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ELEC201',
        name: 'Digital Electronics',
        description: 'Digital circuits and logic design',
        departmentId: createdDepartments['ELEC'].id,
        credits: 3,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
      {
        code: 'ELEC301',
        name: 'Microprocessors',
        description: 'Microprocessor architecture and programming',
        departmentId: createdDepartments['ELEC'].id,
        credits: 4,
        duration: 4,
        level: 'undergraduate',
        isActive: true,
      },
    ];

    for (const courseData of courses) {
      const existing = await db.Course.findOne({
        where: { code: courseData.code },
      });

      if (!existing) {
        await db.Course.create(courseData);
        console.log(`✅ Created course: ${courseData.name}`);
      } else {
        console.log(`   Course ${courseData.name} already exists`);
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
