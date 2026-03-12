// models/Appointment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

  farmer_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  adviser_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

  subject: { type: DataTypes.STRING(200), allowNull: false },
  appointment_date: { type: DataTypes.DATE, allowNull: false, comment: 'Start date/time' },
  duration_minutes: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duration in minutes'
  },
  location: { type: DataTypes.STRING(255), allowNull: true },
  message:  { type: DataTypes.TEXT, allowNull: true },

  appointment_status: {
    type: DataTypes.ENUM('pending','confirmed','cancelled','completed'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'appointments',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['farmer_id'] },
    { fields: ['adviser_id'] },
    { fields: ['appointment_date'] },
    { fields: ['appointment_status'] },
  ]
});

module.exports = Appointment;
