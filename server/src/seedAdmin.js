require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./models');

async function seedAdmin() {
  try {
    // Sync database
    await db.sequelize.sync();

    // Check if admin already exists
    const existingAdmin = await db.User.findOne({
      where: { email: 'admin@school.edu' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@school.edu');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await db.User.create({
      email: 'admin@school.edu',
      password: hashedPassword,
      firstName: 'ប្រព័ន្ធ',
      lastName: 'អ្នកគ្រប់គ្រង',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('================================');
    console.log('Email: admin@school.edu');
    console.log('Password: admin123');
    console.log('================================');
    console.log('Please change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
