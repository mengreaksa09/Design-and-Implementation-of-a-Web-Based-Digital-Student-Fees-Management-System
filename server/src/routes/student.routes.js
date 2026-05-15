const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const {
  paginate,
  buildPaginationResponse,
  generateStudentId,
} = require('../utils/helpers.util');
const { sendEmail } = require('../utils/email.util');
const db = require('../models');
const { Op } = require('sequelize');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Get all students
router.get('/', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      class: classFilter,
      department,
      status,
      includeAll,
      paymentStatus,
    } = req.query;

    const where = {};
    const userWhere = {};

    console.log('=== FILTER DEBUG ===');
    console.log('Department:', department);
    console.log('PaymentStatus:', paymentStatus);
    console.log('==================');

    if (search) {
      where[Op.or] = [
        { studentId: { [Op.like]: `%${search}%` } },
        { '$user.firstName$': { [Op.like]: `%${search}%` } },
        { '$user.lastName$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
      ];
    }

    if (classFilter) where.class = classFilter;
    if (department) where.department = department;
    // Only show active students by default, unless status filter is explicitly provided or includeAll is true
    if (includeAll === 'true') {
      // Don't filter by status - include all students
    } else if (status) {
      where.status = status;
    } else {
      where.status = { [Op.ne]: 'inactive' };
    }

    const includeUser = {
      model: db.User,
      as: 'user',
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
      },
    };
    if (Object.keys(userWhere).length > 0) {
      includeUser.where = userWhere;
    }

    // Fetch all students without pagination if payment status filter is applied
    const shouldPaginateLater = !!paymentStatus;
    const queryOptions = {
      where,
      include: [
        includeUser,
        {
          model: db.FeeAssignment,
          as: 'feeAssignments',
          required: false,
          attributes: ['totalAmount', 'paidAmount'],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    // Only add pagination if we're not filtering by payment status
    if (!shouldPaginateLater) {
      const { limit: limitVal, offset } = paginate(page, limit);
      queryOptions.limit = limitVal;
      queryOptions.offset = offset;
    }

    const { count, rows: students } = await db.Student.findAndCountAll(
      queryOptions
    );

    // Calculate fee totals for each student
    let studentsWithFees = students.map((student) => {
      const studentData = student.toJSON();
      const assignments = studentData.feeAssignments || [];
      studentData.totalFees = assignments.reduce(
        (sum, a) => sum + parseFloat(a.totalAmount || 0),
        0
      );
      studentData.paidFees = assignments.reduce(
        (sum, a) => sum + parseFloat(a.paidAmount || 0),
        0
      );

      // Calculate payment status
      const percentage =
        studentData.totalFees > 0
          ? (studentData.paidFees / studentData.totalFees) * 100
          : 0;
      if (percentage >= 100) {
        studentData.paymentStatus = 'paid';
      } else if (percentage > 0) {
        studentData.paymentStatus = 'partial';
      } else if (studentData.totalFees > 0) {
        studentData.paymentStatus = 'unpaid';
      } else {
        studentData.paymentStatus = 'no-fees';
      }

      delete studentData.feeAssignments; // Remove the raw assignments from response
      return studentData;
    });

    // Filter by payment status if provided
    if (paymentStatus) {
      studentsWithFees = studentsWithFees.filter((student) => {
        // Treat 'no-fees' students as 'unpaid' when filtering for unpaid
        if (paymentStatus === 'unpaid') {
          return student.paymentStatus === 'unpaid' || student.paymentStatus === 'no-fees';
        }
        return student.paymentStatus === paymentStatus;
      });
    }

    // Apply pagination after filtering if payment status was used
    let finalStudents = studentsWithFees;
    let finalCount = studentsWithFees.length;

    if (shouldPaginateLater) {
      const { limit: limitVal, offset } = paginate(page, limit);
      finalStudents = studentsWithFees.slice(offset, offset + limitVal);
      finalCount = studentsWithFees.length;
    } else {
      finalCount = count;
    }

    res.json({
      success: true,
      ...buildPaginationResponse(finalStudents, finalCount, page, limit),
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: error.message,
    });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await db.Student.findByPk(req.params.id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: {
            exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
          },
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignments',
          include: [
            {
              model: db.FeeStructure,
              as: 'feeStructure',
            },
          ],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check access for student role
    if (req.user.role === 'student') {
      const userStudent = await db.Student.findOne({
        where: { userId: req.user.id },
      });
      if (!userStudent || userStudent.id !== student.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student',
      error: error.message,
    });
  }
});

// Create student with user account
router.post(
  '/',
  auth,
  authorize('admin', 'accountant'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  validate,
  async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        studentIdNumber,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        zipCode,
        country,
        class: studentClass,
        department,
        course,
        academicYear,
        semester,
        enrollmentDate,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
      } = req.body;

      // Check if email exists
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await db.User.create(
        {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'student',
        },
        { transaction }
      );

      // Generate student ID if not provided
      const generatedStudentId = studentIdNumber || generateStudentId();

      // Create student profile
      const student = await db.Student.create(
        {
          userId: user.id,
          studentId: generatedStudentId,
          dateOfBirth,
          gender,
          address,
          city,
          state,
          zipCode,
          country,
          class: studentClass,
          department,
          course,
          academicYear,
          semester,
          enrollmentDate,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
        },
        { transaction }
      );

      await transaction.commit();

      // Send welcome email
      sendEmail(email, 'welcomeEmail', {
        name: `${firstName} ${lastName}`,
        email,
        role: 'student',
        studentId: generatedStudentId,
      });

      logActivity(
        req.user.id,
        'CREATE_STUDENT',
        'Student',
        student.id,
        `Created student: ${generatedStudentId}`,
        null,
        null,
        req
      );

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
          id: student.id,
          studentId: student.studentId,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: error.message,
      });
    }
  }
);

// Update student
router.put('/:id', auth, authorize('admin', 'accountant'), async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const student = await db.Student.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'user' }],
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      country,
      class: studentClass,
      department,
      course,
      academicYear,
      semester,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation,
      status,
    } = req.body;

    // Update user
    if (firstName || lastName || phone) {
      await student.user.update(
        {
          firstName: firstName || student.user.firstName,
          lastName: lastName || student.user.lastName,
          phone: phone !== undefined ? phone : student.user.phone,
        },
        { transaction }
      );
    }

    // Update student
    await student.update(
      {
        dateOfBirth: dateOfBirth || student.dateOfBirth,
        gender: gender || student.gender,
        address: address !== undefined ? address : student.address,
        city: city !== undefined ? city : student.city,
        state: state !== undefined ? state : student.state,
        zipCode: zipCode !== undefined ? zipCode : student.zipCode,
        country: country || student.country,
        class: studentClass || student.class,
        department: department || student.department,
        course: course || student.course,
        academicYear: academicYear || student.academicYear,
        semester: semester || student.semester,
        guardianName:
          guardianName !== undefined ? guardianName : student.guardianName,
        guardianPhone:
          guardianPhone !== undefined ? guardianPhone : student.guardianPhone,
        guardianEmail:
          guardianEmail !== undefined ? guardianEmail : student.guardianEmail,
        guardianRelation:
          guardianRelation !== undefined
            ? guardianRelation
            : student.guardianRelation,
        status: status || student.status,
      },
      { transaction }
    );

    await transaction.commit();

    logActivity(
      req.user.id,
      'UPDATE_STUDENT',
      'Student',
      student.id,
      `Updated student: ${student.studentId}`,
      null,
      req.body,
      req
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message,
    });
  }
});

// Delete student (soft delete)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const student = await db.Student.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'user' }],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    await student.update({ status: 'inactive' });
    await student.user.update({ isActive: false });

    logActivity(
      req.user.id,
      'DELETE_STUDENT',
      'Student',
      student.id,
      `Deactivated student: ${student.studentId}`,
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Student deactivated successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message,
    });
  }
});

// Bulk import students from CSV
router.post(
  '/import',
  auth,
  authorize('admin'),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const results = [];
    const errors = [];
    let successCount = 0;

    // Helper function to normalize column names
    const normalizeKey = (key) => key.toLowerCase().replace(/[_\s-]/g, '');

    // Helper function to get value from record with flexible column names
    const getValue = (record, ...possibleNames) => {
      for (const name of possibleNames) {
        for (const key of Object.keys(record)) {
          if (normalizeKey(key) === normalizeKey(name)) {
            return record[key]?.trim();
          }
        }
      }
      return undefined;
    };

    try {
      const records = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => records.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      // Get current total student count (including inactive) for sequential ID generation
      const totalStudents = await db.Student.count();
      let studentIdCounter = totalStudents;

      for (const record of records) {
        try {
          // Flexibly extract fields from CSV with various column name formats
          const email = getValue(
            record,
            'email',
            'emailaddress',
            'email_address'
          );
          const password = getValue(record, 'password', 'pass', 'pwd');
          const firstName = getValue(
            record,
            'firstName',
            'firstname',
            'first_name',
            'first',
            'fname'
          );
          const lastName = getValue(
            record,
            'lastName',
            'lastname',
            'last_name',
            'last',
            'lname'
          );
          const studentId = getValue(
            record,
            'studentId',
            'studentid',
            'student_id',
            'id',
            'stuid'
          );
          const studentClass = getValue(
            record,
            'class',
            'grade',
            'year',
            'yearlevel',
            'year_level'
          );
          const departmentName = getValue(
            record,
            'department',
            'dept',
            'program'
          );
          const courseName = getValue(
            record,
            'course',
            'major',
            'coursename',
            'course_name'
          );
          const phone = getValue(
            record,
            'phone',
            'phonenumber',
            'phone_number',
            'contact',
            'mobile'
          );
          const academicYear = getValue(
            record,
            'academicYear',
            'academicyear',
            'academic_year',
            'schoolyear',
            'school_year'
          );
          const semester = getValue(record, 'semester', 'sem', 'term');

          if (!email || !firstName || !lastName) {
            errors.push({
              row: record,
              error: 'Missing required fields (email, firstName, lastName)',
            });
            continue;
          }

          // Check if email exists
          const existingUser = await db.User.findOne({ where: { email } });
          if (existingUser) {
            errors.push({ row: record, error: 'Email already exists' });
            continue;
          }

          // Lookup department ID by name if department name is provided
          let departmentId = null;
          if (departmentName) {
            const department = await db.Department.findOne({
              where: {
                [Op.or]: [
                  { name: departmentName },
                  { name: { [Op.like]: `%${departmentName}%` } },
                  { code: departmentName }
                ]
              }
            });
            if (department) {
              departmentId = department.id;
            } else {
              // Store the department name as-is if not found (backward compatibility)
              console.log(`Warning: Department '${departmentName}' not found, storing as text`);
              departmentId = departmentName;
            }
          }

          // Lookup course ID by name if course name is provided
          let courseId = null;
          if (courseName && departmentId && typeof departmentId === 'number') {
            const course = await db.Course.findOne({
              where: {
                departmentId: departmentId,
                [Op.or]: [
                  { name: courseName },
                  { name: { [Op.like]: `%${courseName}%` } },
                  { code: courseName }
                ]
              }
            });
            if (course) {
              courseId = course.id;
            } else {
              // Store the course name as-is if not found
              console.log(`Warning: Course '${courseName}' not found, storing as text`);
              courseId = courseName;
            }
          } else if (courseName) {
            // If department wasn't found as ID, just store course name as text
            courseId = courseName;
          }

          // Generate default password if not provided: firstname.lastname@000
          const defaultPassword =
            password ||
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}@000`;
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);

          const user = await db.User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: 'student',
          });

          // Generate sequential student ID based on current count
          studentIdCounter++;
          const generatedStudentId = `STU${String(studentIdCounter).padStart(
            6,
            '0'
          )}`;

          const studentData = {
            userId: user.id,
            studentId: generatedStudentId,
            class: studentClass,
            department: departmentId,
            course: courseId,
            academicYear,
            semester,
            status: 'active',
          };

          console.log(`Creating student: ${email} with status: ${studentData.status}`);
          const createdStudent = await db.Student.create(studentData);
          console.log(`Student created with actual status: ${createdStudent.status}`);

          successCount++;
        } catch (error) {
          errors.push({ row: record, error: error.message });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Ensure all newly imported students are active (fix for any that might be created as inactive)
      try {
        await db.Student.update(
          { status: 'active' },
          {
            where: {
              status: 'inactive',
              createdAt: {
                [Op.gte]: new Date(Date.now() - 60000) // Last 60 seconds
              }
            }
          }
        );
        console.log('Ensured all newly imported students are active');
      } catch (err) {
        console.error('Error activating imported students:', err);
      }

      logActivity(
        req.user.id,
        'IMPORT_STUDENTS',
        'Student',
        null,
        `Imported ${successCount} students`,
        null,
        null,
        req
      );

      res.json({
        success: true,
        message: `Import completed. ${successCount} students imported successfully.`,
        data: {
          total: records.length,
          success: successCount,
          failed: errors.length,
          errors,
        },
      });
    } catch (error) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Import students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import students',
        error: error.message,
      });
    }
  }
);

// Get distinct classes
router.get('/meta/classes', auth, async (req, res) => {
  try {
    const classes = await db.Student.findAll({
      attributes: [
        [db.Sequelize.fn('DISTINCT', db.Sequelize.col('class')), 'class'],
      ],
      where: { class: { [Op.ne]: null } },
    });

    res.json({
      success: true,
      data: classes.map((c) => c.class).filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get classes',
      error: error.message,
    });
  }
});

// Get distinct departments
router.get('/meta/departments', auth, async (req, res) => {
  try {
    const departments = await db.Student.findAll({
      attributes: [
        [
          db.Sequelize.fn('DISTINCT', db.Sequelize.col('department')),
          'department',
        ],
      ],
      where: { department: { [Op.ne]: null } },
    });

    res.json({
      success: true,
      data: departments.map((d) => d.department).filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get departments',
      error: error.message,
    });
  }
});

// Get student dashboard data
router.get('/dashboard', auth, authorize('student'), async (req, res) => {
  try {
    // Get current student profile
    const student = await db.Student.findOne({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Get all fee assignments for the student
    const feeAssignments = await db.FeeAssignment.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: db.FeeStructure,
          as: 'FeeStructure',
          attributes: ['id', 'name', 'amount', 'dueDate', 'type'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate fee statistics
    let totalFees = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    const pendingFees = [];

    feeAssignments.forEach((assignment) => {
      const total = parseFloat(assignment.totalAmount || 0);
      const paid = parseFloat(assignment.paidAmount || 0);
      const remaining = total - paid;

      totalFees += total;
      paidAmount += paid;

      if (remaining > 0) {
        const dueDate = assignment.FeeStructure?.dueDate || assignment.dueDate;
        const isOverdue = dueDate && new Date(dueDate) < new Date();

        if (isOverdue) {
          overdueAmount += remaining;
        } else {
          pendingAmount += remaining;
        }

        // Add to pending fees list
        pendingFees.push({
          id: assignment.id,
          amount: total,
          paidAmount: paid,
          dueDate: dueDate,
          FeeStructure: assignment.FeeStructure,
        });
      }
    });

    // Get recent payments
    const recentPayments = await db.Payment.findAll({
      where: {
        '$FeeAssignment.studentId$': student.id,
      },
      include: [
        {
          model: db.FeeAssignment,
          as: 'FeeAssignment',
          include: [
            {
              model: db.FeeStructure,
              as: 'FeeStructure',
              attributes: ['name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Get notifications for the student
    const notifications = await db.Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        totalFees,
        paidAmount,
        pendingAmount,
        overdueAmount,
        pendingFees: pendingFees.slice(0, 4),
        recentPayments,
        notifications,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message,
    });
  }
});

module.exports = router;
