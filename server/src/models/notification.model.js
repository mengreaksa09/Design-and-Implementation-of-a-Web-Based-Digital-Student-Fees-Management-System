module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'fee_due',
          'payment_received',
          'overdue_warning',
          'system',
          'announcement'
        ),
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM('email', 'sms', 'in_app', 'all'),
        defaultValue: 'in_app',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['isRead'] },
      ],
    }
  );

  return Notification;
};
