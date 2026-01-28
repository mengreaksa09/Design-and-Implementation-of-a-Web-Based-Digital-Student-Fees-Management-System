module.exports = (sequelize, DataTypes) => {
  const FeeAssignment = sequelize.define(
    'FeeAssignment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      feeStructureId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'fee_structures',
          key: 'id',
        },
      },
      originalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discountReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lateFeeApplied: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'waived'),
        defaultValue: 'pending',
      },
      academicYear: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      semester: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'fee_assignments',
      timestamps: true,
      indexes: [
        { fields: ['studentId'] },
        { fields: ['feeStructureId'] },
        { fields: ['status'] },
        { fields: ['dueDate'] },
      ],
    }
  );

  return FeeAssignment;
};
