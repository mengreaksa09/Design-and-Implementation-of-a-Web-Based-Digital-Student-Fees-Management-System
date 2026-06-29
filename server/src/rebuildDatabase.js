require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./models');

async function rebuildAndSeed() {
  try {
    console.log('🔄 Starting Database Rebuild...');
    
    // Force sync drops all tables and recreates them
    await db.sequelize.sync({ force: true });
    console.log('✅ Database schema reset successfully (all tables dropped and recreated).\n');

    // 1. Create Admin User
    console.log('👤 Creating Khmer Admin User...');
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);

    const admin = await db.User.create({
      email: 'admin@school.edu',
      password: hashedAdminPassword,
      firstName: 'ប្រព័ន្ធ',
      lastName: 'អ្នកគ្រប់គ្រង',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    console.log('✅ Admin user created (admin@school.edu / admin123)\n');

    // 2. Create Departments
    console.log('🏢 Creating Khmer Departments...');
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
      const dept = await db.Department.create(deptData);
      console.log(`   ✅ ដេប៉ាតឺម៉ង់៖ ${deptData.name}`);
      createdDepartments[deptData.code] = dept;
    }
    console.log('');

    // 3. Create Courses
    console.log('📚 Creating Khmer Courses...');
    const courses = [
      // Computer Science
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
        name: 'រចនាសម្ព័ន្ធទិន្នន័យ និងអាលកូរីត',
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
      // Engineering
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
      // Business Administration
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
      // Architecture
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
      // Electronics
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
      await db.Course.create(courseData);
      console.log(`   ✅ មុខវិជ្ជា៖ ${courseData.name} (${courseData.code})`);
    }
    console.log('');

    // 4. Create Fee Structures
    console.log('💳 Creating Khmer Fee Structures...');
    const feeStructures = [
      {
        name: 'ថ្លៃសិក្សា - ថ្នាក់បរិញ្ញាបត្រ',
        description: 'ថ្លៃសិក្សាប្រចាំឆ្នាំសម្រាប់និស្សិតថ្នាក់បរិញ្ញាបត្រ',
        feeType: 'Tuition',
        amount: 5000.0,
        currency: 'USD',
        frequency: 'year',
        applicableClasses: JSON.stringify(['Freshman', 'Sophomore', 'Junior', 'Senior']),
        academicYear: '2025-2026',
        lateFeePercentage: 5.0,
        gracePeriodDays: 7,
        isActive: true,
        isMandatory: true,
      },
      {
        name: 'ថ្លៃសេវាបណ្ណាល័យ',
        description: 'ថ្លៃសេវាបណ្ណាល័យ និងការអានសៀវភៅប្រចាំឆ្នាំ',
        feeType: 'Library',
        amount: 200.0,
        currency: 'USD',
        frequency: 'year',
        academicYear: '2025-2026',
        lateFeeAmount: 20.0,
        gracePeriodDays: 7,
        isActive: true,
        isMandatory: true,
      },
      {
        name: 'ថ្លៃសេវាពិសោធន៍',
        description: 'ថ្លៃសេវាប្រើប្រាស់បន្ទប់ពិសោធន៍ និងសម្ភារៈពិសោធន៍',
        feeType: 'Laboratory',
        amount: 300.0,
        currency: 'USD',
        frequency: 'semester',
        applicableDepartments: JSON.stringify(['Science', 'Engineering', 'Computer Science']),
        academicYear: '2025-2026',
        lateFeePercentage: 3.0,
        gracePeriodDays: 5,
        isActive: true,
        isMandatory: false,
      },
      {
        name: 'ថ្លៃប្រឡង',
        description: 'ថ្លៃរៀបចំការប្រឡង និងការវាយតម្លៃលទ្ធផល',
        feeType: 'Exam',
        amount: 100.0,
        currency: 'USD',
        frequency: 'semester',
        academicYear: '2025-2026',
        lateFeeAmount: 25.0,
        gracePeriodDays: 3,
        isActive: true,
        isMandatory: true,
      },
      {
        name: 'ថ្លៃសកម្មភាពកីឡា',
        description: 'ថ្លៃសេវាប្រើប្រាស់ទីលានកីឡា និងសកម្មភាពកីឡាផ្សេងៗ',
        feeType: 'Sports',
        amount: 100.0,
        currency: 'USD',
        frequency: 'year',
        academicYear: '2025-2026',
        lateFeeAmount: 10.0,
        gracePeriodDays: 7,
        isActive: true,
        isMandatory: false,
      },
      {
        name: 'ថ្លៃសេវាដឹកជញ្ជូន',
        description: 'ថ្លៃសេវាឡានក្រុងដឹកជញ្ជូនប្រចាំខែ',
        feeType: 'Transport',
        amount: 75.0,
        currency: 'USD',
        frequency: 'monthly',
        academicYear: '2025-2026',
        lateFeeAmount: 5.0,
        gracePeriodDays: 3,
        isActive: true,
        isMandatory: false,
      },
    ];

    for (const feeData of feeStructures) {
      await db.FeeStructure.create(feeData);
      console.log(`   ✅ រចនាសម្ព័ន្ធបង់ថ្លៃ៖ ${feeData.name} ($${feeData.amount})`);
    }
    console.log('');

    // 5. Create Sample Student
    console.log('👤 Creating Khmer Sample Student...');
    const hashedStudentPassword = await bcrypt.hash('student123', salt);

    const studentUser = await db.User.create({
      email: 'sok.chan@student.edu',
      password: hashedStudentPassword,
      firstName: 'ចាន់',
      lastName: 'សុខ',
      role: 'student',
      isActive: true,
      isEmailVerified: true,
    });

    const student = await db.Student.create({
      studentId: 'STU2025001',
      userId: studentUser.id,
      firstName: 'ចាន់',
      lastName: 'សុខ',
      email: 'sok.chan@student.edu',
      gender: 'male',
      dateOfBirth: '2000-01-15',
      nationality: 'កម្ពុជា',
      address: 'ផ្ទះលេខ ១២ ផ្លូវសហព័ន្ធរុស្ស៊ី សង្កាត់ទឹកថ្លា ខណ្ឌសែនសុខ ភ្នំពេញ',
      phone: '012345678',
      guardianName: 'សុខ ជា',
      guardianPhone: '098765432',
      guardianRelationship: 'ម្តាយ',
      studyLevel: 'undergraduate',
      class: 'Sophomore',
      semester: 'Spring 2025',
      department: 'វិទ្យាសាស្ត្រកុំព្យូទ័រ',
      course: 'សេចក្តីផ្តើមនៃកម្មវិធីកុំព្យូទ័រ',
      enrollmentDate: '2023-09-01',
      status: 'active',
    });

    console.log('✅ Student user created (sok.chan@student.edu / student123)');
    console.log('✅ Student record created (ID: STU2025001)\n');

    console.log('✨ DATABASE REBUILD COMPLETED SUCCESSFULLY! ✨');
    console.log('=============================================');
    console.log('Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@school.edu');
    console.log('  Password: admin123');
    console.log('Student:');
    console.log('  Email: sok.chan@student.edu');
    console.log('  Password: student123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error rebuilding and seeding database:', error);
    process.exit(1);
  }
}

rebuildAndSeed();
