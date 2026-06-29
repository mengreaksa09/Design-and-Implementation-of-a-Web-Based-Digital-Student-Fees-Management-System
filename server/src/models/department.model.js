module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
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
        comment: 'Unique department code',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      headOfDepartment: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of the department head',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('email', value === '' ? null : value);
        },
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Building or floor location',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      establishedYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1900,
          max: 2100,
        },
      },
      facultyCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of faculty members',
      },
      studentCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of students the department can accommodate',
      },
    },
    {
      tableName: 'departments',
      timestamps: true,
      indexes: [
        { fields: ['code'], unique: true },
        { fields: ['isActive'] },
        { fields: ['name'] },
      ],
    }
  );

  return Department;
};
