require('dotenv').config();
const db = require('./models');

const translations = {
  'Kanha': 'កញ្ញា', 'Meas': 'មាស',
  'Bopha': 'បុប្ផា', 'Sen': 'សែន',
  'Veasna': 'វាសនា', 'Heng': 'ហេង',
  'Chenda': 'ចិន្តា', 'Roath': 'រ័ត្ន',
  'Ratha': 'រដ្ឋា', 'Sun': 'ស៊ុន',
  'Srey': 'ស្រី', 'Mey': 'ម៉ី',
  'Nita': 'នីតា', 'Horn': 'ហន',
  'Reth': 'រ៉េត', 'Noun': 'នួន',
  'Sokly': 'សុខលី', 'Touch': 'ទូច',
  'Pisey': 'ពិសី', 'Long': 'ឡុង',
  'Lim': 'លីម', 'Sovann': 'សុវណ្ណ',
  'Vireak': 'វិរៈ', 'Phan': 'ផាន់',
  'Metri': 'មេត្រី', 'Rin': 'រិន',
  'Sophan': 'សុផាន់', 'Chea': 'ជា',
  'Mony': 'មុន្នី', 'Kea': 'គា',
  'Sokha': 'សុខា', 'Chan': 'ចាន់',
  'Dara': 'តារា', 'Sok': 'សុខ',
  'Tonlang': 'តុងឡាង', 'Kim': 'គីម',
  'Makara': 'មករា', 'Chhim': 'ឈឹម'
};

async function translateNames() {
  try {
    await db.sequelize.sync();
    const students = await db.Student.findAll({
      include: [{ model: db.User, as: 'user' }]
    });

    let updatedCount = 0;

    for (const student of students) {
      if (student.user) {
        const engFirst = student.user.firstName;
        const engLast = student.user.lastName;

        // Skip if already Khmer (contains Khmer characters)
        const isKhmer = /[\u1780-\u17FF]/.test(engFirst || '');
        
        if (!isKhmer && engFirst && engLast) {
          const khmerFirst = translations[engFirst] || engFirst;
          const khmerLast = translations[engLast] || engLast;
          const englishFullName = `${engFirst} ${engLast}`.toUpperCase();

          // Update User with Khmer names
          await student.user.update({
            firstName: khmerFirst,
            lastName: khmerLast
          }, { hooks: false });

          // Update Student with English Full Name in Latin_Name
          await student.update({
            Full_Name: englishFullName
          }, { hooks: false });

          updatedCount++;
        }
      }
    }

    console.log(`Successfully translated and updated ${updatedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

translateNames();
