const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PredictionHistory = sequelize.define('PredictionHistory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

  // FK → users.id
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

  avg_humidity: { type: DataTypes.DECIMAL(5,2), allowNull: true },
  temp: { type: DataTypes.DECIMAL(5,2), allowNull: true },
  avg_rainfall: { type: DataTypes.DECIMAL(6,2), allowNull: true },
  land_area: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  soil_type: { type: DataTypes.STRING(100), allowNull: true },
  soil_ph_level: { type: DataTypes.DECIMAL(4,2), allowNull: true },
  nitrogen: { type: DataTypes.DECIMAL(6,2), allowNull: true },
  phosphate: { type: DataTypes.DECIMAL(6,2), allowNull: true },
  potassium: { type: DataTypes.DECIMAL(6,2), allowNull: true },
  district: { type: DataTypes.STRING(100), allowNull: true },
  agro_ecological_zone: { type: DataTypes.STRING(100), allowNull: true },
  cultivate_season: { type: DataTypes.STRING(100), allowNull: true },

  // you had "cropnameVARCHAR(100)" inline; making it a proper field:
  crop_name: { type: DataTypes.STRING(100), allowNull: true },
}, {
  tableName: 'prediction_history',
  underscored: true,
  timestamps: true,      // adds created_at, updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] }
  ]
});

module.exports = PredictionHistory;
