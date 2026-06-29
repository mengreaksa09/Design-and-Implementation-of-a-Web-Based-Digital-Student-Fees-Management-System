module.exports = (sequelize, DataTypes) => {
  const ClassEnrollment = sequelize.define(
    'ClassEnrollment',
    {
      Enrollment_ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      Student_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'students',
          key: 'studentId', // references the unique studentId / Student_ID column
        },
      },
      Class_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'Class_ID',
        },
      },
      Academic_Year: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'class_enrollments',
      timestamps: true,
      indexes: [
        { fields: ['Student_ID'] },
        { fields: ['Class_ID'] },
        { fields: ['Academic_Year'] },
      ],
    }
  );

  return ClassEnrollment;
};
