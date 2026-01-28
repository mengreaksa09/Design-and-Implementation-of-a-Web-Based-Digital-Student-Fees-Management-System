module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id',
        },
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      stripePaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripeChargeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gatewayResponse: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'initiated',
          'processing',
          'completed',
          'failed',
          'refunded'
        ),
        defaultValue: 'initiated',
      },
      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refundDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refundReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'transactions',
      timestamps: true,
      indexes: [
        { fields: ['transactionId'] },
        { fields: ['stripePaymentIntentId'] },
        { fields: ['status'] },
      ],
    }
  );

  return Transaction;
};
