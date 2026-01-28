module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define(
    'Settings',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
      indexes: [{ fields: ['key'] }, { fields: ['category'] }],
    }
  );

  return Settings;
};
