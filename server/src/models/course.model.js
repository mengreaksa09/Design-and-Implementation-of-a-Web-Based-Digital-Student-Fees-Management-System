module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define(
    'Course',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Unique course code',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      departmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
          min: 1,
          max: 10,
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in years',
        validate: {
          min: 1,
          max: 10,
        },
      },
      level: {
        type: DataTypes.ENUM(
          'certificate',
          'diploma',
          'undergraduate',
          'postgraduate',
          'doctorate'
        ),
        defaultValue: 'undergraduate',
      },
      tuitionFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Base tuition fee per semester/year',
      },
      admissionRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      maxStudents: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of students per intake',
      },
      currentEnrollment: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Current number of enrolled students',
      },
      coordinator: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of the course coordinator',
      },
      accreditation: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Accreditation body or status',
      },
    },
    {
      tableName: 'courses',
      timestamps: true,
      indexes: [
        { fields: ['code'], unique: true },
        { fields: ['departmentId'] },
        { fields: ['isActive'] },
        { fields: ['level'] },
      ],
    }
  );

  return Course;
};
