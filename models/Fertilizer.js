// models/Fertilizer.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Fertilizer = sequelize.define('Fertilizer', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

  crop: { type: DataTypes.STRING(120), allowNull: false },

  fertilizer_name: { type: DataTypes.STRING(160), allowNull: false },

  fertilizer_type: {
    type: DataTypes.ENUM('nitrogen','phosphorus','potassium','npk','organic','micronutrient','foliar','other'),
    allowNull: false,
    defaultValue: 'nitrogen'
  },

  application_date: { type: DataTypes.DATE, allowNull: false },

  next_application_date: { type: DataTypes.DATE, allowNull: true },

  quantity: { type: DataTypes.DECIMAL(10,2), allowNull: true, comment: 'e.g., kg or L (decide unit in UI)' },

  application_method: { type: DataTypes.STRING(120), allowNull: true, comment: 'Broadcast, Banding, Drip, Spray, etc.' },

  location: { type: DataTypes.STRING(255), allowNull: true },

  land_size: { type: DataTypes.STRING(80), allowNull: true, comment: 'e.g., 0.5 acre, 20 perches, 0.2 ha' },

  note: { type: DataTypes.TEXT, allowNull: true }, // (“Not” in your msg—assuming you meant Note)
}, {
  tableName: 'fertilizers',
  underscored: true,
  timestamps: true, // -> created_at / updated_at
  indexes: [
    { fields: ['user_id'] },
    { fields: ['crop'] },
    { fields: ['fertilizer_type'] },
    { fields: ['application_date'] },
  ],
});

module.exports = Fertilizer;
