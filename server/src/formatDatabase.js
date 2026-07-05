require('dotenv').config();
const db = require('./models');

// Logic matching the frontend
const capitalizeWords = (str) => {
  const lowerCaseWords = ['and', 'or', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an'];
  return str.split(' ').map((word, index) => {
    if (!word) return word;
    let w = word.toLowerCase();
    if (index !== 0 && lowerCaseWords.includes(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
};

const formatTitlesWithDot = (str) => {
  const titles = ['mr', 'mrs', 'ms', 'mis', 'dr', 'prof'];
  return str.split(' ').map(word => {
    if (!word) return word;
    const w = word.toLowerCase();
    const bareWord = w.endsWith('.') ? w.slice(0, -1) : w;
    if (titles.includes(bareWord)) {
      return word.endsWith('.') ? word : word + '.';
    }
    return word;
  }).join(' ');
};

const formatName = (name) => {
  if (!name) return name;
  return formatTitlesWithDot(capitalizeWords(name));
};

async function updateDatabase() {
  try {
    await db.sequelize.sync();
    let updatedDepartments = 0;
    let updatedCourses = 0;

    // Update Departments
    if (db.Department) {
      const departments = await db.Department.findAll();
      for (const dept of departments) {
        if (dept.headOfDepartment) {
          const formatted = formatName(dept.headOfDepartment);
          if (formatted !== dept.headOfDepartment) {
            await dept.update({ headOfDepartment: formatted }, { hooks: false });
            updatedDepartments++;
          }
        }
      }
    }

    // Update Courses
    if (db.Course) {
      const courses = await db.Course.findAll();
      for (const course of courses) {
        if (course.coordinator) {
          const formatted = formatName(course.coordinator);
          if (formatted !== course.coordinator) {
            await course.update({ coordinator: formatted }, { hooks: false });
            updatedCourses++;
          }
        }
      }
    }

    console.log(`Successfully updated ${updatedDepartments} departments and ${updatedCourses} courses.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDatabase();
