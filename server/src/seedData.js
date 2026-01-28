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
        firstName: 'System',
        lastName: 'Administrator',
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
        name: 'Tuition Fee - Undergraduate',
        description: 'Annual tuition fee for undergraduate students',
        feeType: 'tuition',
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
        name: 'Library Fee',
        description: 'Annual library access and services fee',
        feeType: 'library',
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
        name: 'Laboratory Fee',
        description: 'Fee for laboratory usage and materials',
        feeType: 'laboratory',
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
        name: 'Exam Fee',
        description: 'Examination and assessment fee',
        feeType: 'exam',
        amount: 150.0,
        currency: 'USD',
        frequency: 'semester',
        academicYear: '2025-2026',
        lateFeeAmount: 25.0,
        gracePeriodDays: 3,
        isActive: true,
        isMandatory: true,
      },
      {
        name: 'Sports Fee',
        description: 'Sports facilities and activities fee',
        feeType: 'sports',
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
        name: 'Transport Fee',
        description: 'Monthly transport service fee',
        feeType: 'transport',
        amount: 50.0,
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
        email: 'john.doe@student.edu',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        isActive: true,
        isEmailVerified: true,
      });

      // Create student record
      student = await db.Student.create({
        studentId: 'STU2025001',
        userId: studentUser.id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@student.edu',
        gender: 'male',
        dateOfBirth: '2000-01-15',
        nationality: 'United States',
        address: '123 Student Street, University City',
        phone: '+1234567890',
        guardianName: 'Jane Doe',
        guardianPhone: '+1234567891',
        guardianRelationship: 'Mother',
        studyLevel: 'undergraduate',
        class: 'Sophomore',
        semester: 'Spring 2025',
        department: 'Computer Science',
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
    console.log('  Email: john.doe@student.edu');
    console.log('  Password: student123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
