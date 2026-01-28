module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      studentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        defaultValue: 'Cambodia',
      },
      class: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      course: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      academicYear: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      semester: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      enrollmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      guardianName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guardianPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guardianEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guardianRelation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      telegramChatId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      telegramUsername: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'students',
      timestamps: true,
      indexes: [
        { fields: ['studentId'] },
        { fields: ['class'] },
        { fields: ['department'] },
        { fields: ['status'] },
      ],
    }
  );

  return Student;
};
