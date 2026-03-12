// models/Message.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Message = sequelize.define("Message", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

  // Either a peer-to-peer or a room:
  room: { type: DataTypes.STRING(100), allowNull: true },

  sender_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // null when using rooms

  text: { type: DataTypes.TEXT, allowNull: true },

  // status flags
  delivered_at: { type: DataTypes.DATE, allowNull: true },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "messages",
  underscored: true,
  timestamps: true, // created_at, updated_at
});

module.exports = Message;
