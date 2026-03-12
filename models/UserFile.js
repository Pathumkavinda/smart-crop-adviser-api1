// models/UserFile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const UserFile = sequelize.define('UserFile', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

  // Who the file belongs to (farmer) and who uploaded it (adviser)
  farmer_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'User ID of the farmer (owner)' },
  adviser_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'User ID of the adviser (uploader)' },

  // Upload metadata
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  stored_name:   { type: DataTypes.STRING(255), allowNull: false },
  mime_type:     { type: DataTypes.STRING(100), allowNull: false },
  size_bytes:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

  // Optional categorization / notes
  category: { type: DataTypes.STRING(50), allowNull: true }, // e.g. 'soil', 'recommendation', 'photo'
  notes:    { type: DataTypes.TEXT, allowNull: true },

  // Optional—quick public URL if you want to serve via /uploads
  public_url: { type: DataTypes.STRING(512), allowNull: true },
}, {
  tableName: 'user_files',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['farmer_id'] },
    { fields: ['adviser_id'] },
    { fields: ['category'] },
    { fields: ['created_at'] },
  ],
});

module.exports = UserFile;
