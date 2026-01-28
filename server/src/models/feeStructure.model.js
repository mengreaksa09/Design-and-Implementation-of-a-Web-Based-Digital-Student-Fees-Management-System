module.exports = (sequelize, DataTypes) => {
  const FeeStructure = sequelize.define(
    'FeeStructure',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feeType: {
        type: DataTypes.ENUM(
          'tuition',
          'exam',
          'library',
          'transport',
          'laboratory',
          'sports',
          'hostel',
          'other'
        ),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      frequency: {
        type: DataTypes.ENUM(
          'one-time',
          'monthly',
          'quarterly',
          'semester',
          'yearly'
        ),
        defaultValue: 'semester',
      },
      applicableClasses: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of class names this fee applies to',
      },
      applicableDepartments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of department names this fee applies to',
      },
      academicYear: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      lateFeePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Late fee percentage to add after due date',
      },
      lateFeeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Fixed late fee amount to add after due date',
      },
      gracePeriodDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Days after due date before late fee applies',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isMandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'fee_structures',
      timestamps: true,
      indexes: [
        { fields: ['feeType'] },
        { fields: ['academicYear'] },
        { fields: ['isActive'] },
      ],
    }
  );

  return FeeStructure;
};
