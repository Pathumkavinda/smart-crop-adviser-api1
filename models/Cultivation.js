// models/Cultivation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Cultivation = sequelize.define('Cultivation', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

  crop: { type: DataTypes.STRING(120), allowNull: false },

  location: { type: DataTypes.STRING(255), allowNull: true },

  // you wrote "landsoze" — using normalized "land_size"
  land_size: { type: DataTypes.STRING(80), allowNull: true, comment: 'e.g., 1.0 acre / 0.4 ha / 20 perches' },

  // you asked “status (string)”
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'planning' },

  // you wrote "palaning date" — normalized "planning_date"
  planning_date: { type: DataTypes.DATE, allowNull: false },

  // you wrote "expextedharvestdae" — normalized "expected_harvest_date"
  expected_harvest_date: { type: DataTypes.DATE, allowNull: true },

  note: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'cultivations',
  underscored: true,   // -> created_at / updated_at
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['crop'] },
    { fields: ['status'] },
    { fields: ['planning_date'] },
    { fields: ['expected_harvest_date'] },
  ],
});

module.exports = Cultivation;
