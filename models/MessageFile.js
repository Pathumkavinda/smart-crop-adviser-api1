// models/MessageFile.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const MessageFile = sequelize.define("MessageFile", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

  // Stored locally or on S3
  filepath: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
}, {
  tableName: "message_files",
  underscored: true,
  timestamps: true,
});

module.exports = MessageFile;
