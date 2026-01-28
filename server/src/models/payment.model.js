module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
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
      feeAssignmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'fee_assignments',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      paymentMethod: {
        type: DataTypes.ENUM(
          'cash',
          'card',
          'bank_transfer',
          'mobile_payment',
          'cheque',
          'online'
        ),
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      receiptNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      receiptPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      qrCode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending',
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
      indexes: [
        { fields: ['studentId'] },
        { fields: ['receiptNumber'] },
        { fields: ['paymentDate'] },
        { fields: ['status'] },
      ],
    }
  );

  return Payment;
};
