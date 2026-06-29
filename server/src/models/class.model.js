module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define(
    'Class',
    {
      Class_ID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      Class_Name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      Fee_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
    },
    {
      tableName: 'classes',
      timestamps: true,
      indexes: [
        { fields: ['Class_ID'] },
        { fields: ['Class_Name'] },
      ],
    }
  );

  return Class;
};
