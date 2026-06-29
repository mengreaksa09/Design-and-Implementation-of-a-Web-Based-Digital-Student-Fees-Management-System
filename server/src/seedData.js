require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./models');

async function seedData() {
  try {
    // Sync database
    await db.sequelize.sync();

    console.log('Starting data seeding...\n');

    // 1. Create Admin User
    console.log('1. Creating admin user...');
    let admin = await db.User.findOne({ where: { email: 'admin@school.edu' } });

    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      admin = await db.User.create({
        email: 'admin@school.edu',
        password: hashedPassword,
        firstName: 'ប្រព័ន្ធ',
        lastName: 'អ្នកគ្រប់គ្រង',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // 2. Create Fee Structures
    console.log('\n2. Creating fee structures...');
    const feeStructures = [
      {
        name: 'ថ្លៃសិក្សា - ថ្នាក់បរិញ្ញាបត្រ',
        description: 'ថ្លៃសិក្សាប្រចាំឆ្នាំសម្រាប់និស្សិតថ្នាក់បរិញ្ញាបត្រ',
        feeType: 'Tuition',
        amount: 5000.0,
        currency: 'USD',
        frequency: 'year',
        applicableClasses: JSON.stringify([
          'Freshman',
          'Sophomore',
          'Junior',
          'Senior',
        ]),
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
        applicableDepartments: JSON.stringify([
          'Science',
          'Engineering',
          'Computer Science',
        ]),
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
      const existing = await db.FeeStructure.findOne({
        where: { name: feeData.name },
      });

      if (!existing) {
        await db.FeeStructure.create(feeData);
        console.log(`✅ Created: ${feeData.name}`);
      } else {
        console.log(`   ${feeData.name} already exists`);
      }
    }

    // 3. Create Sample Student
    console.log('\n3. Creating sample student...');
    let student = await db.Student.findOne({
      where: { studentId: 'STU2025001' },
    });

    if (!student) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('student123', salt);

      // Create student user account
      const studentUser = await db.User.create({
        email: 'sok.chan@student.edu',
        password: hashedPassword,
        firstName: 'ចាន់',
        lastName: 'សុខ',
        role: 'student',
        isActive: true,
        isEmailVerified: true,
      });

      // Create student record
      student = await db.Student.create({
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

      console.log('✅ Sample student created');
    } else {
      console.log('✅ Sample student already exists');
    }

    console.log('\n✅ Data seeding completed successfully!\n');
    console.log('=================================');
    console.log('Login credentials:');
    console.log('Admin:');
    console.log('  Email: admin@school.edu');
    console.log('  Password: admin123');
    console.log('\nStudent:');
    console.log('  Email: sok.chan@student.edu');
    console.log('  Password: student123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
