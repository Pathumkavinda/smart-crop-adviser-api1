// models/index.js
const sequelize = require('../database/connection');
const User = require('./User');
const PredictionHistory = require('./PredictionHistory');
const Message = require('./Message');
const MessageFile = require('./MessageFile');
const UserFile = require('./UserFile');
const Appointment = require('./Appointment');   // if present
const Fertilizer = require('./Fertilizer');     // if present

// 🔹 NEW
const Cultivation = require('./Cultivation');

// Existing associations...
User.hasMany(PredictionHistory, { foreignKey: 'user_id', as: 'predictions', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
PredictionHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages_sent' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'messages_received' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

Message.hasMany(MessageFile, { foreignKey: 'message_id', as: 'files', onDelete: 'CASCADE' });
MessageFile.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

User.hasMany(UserFile, { foreignKey: 'farmer_id', as: 'files_as_farmer', onDelete: 'CASCADE' });
User.hasMany(UserFile, { foreignKey: 'adviser_id', as: 'files_as_adviser', onDelete: 'CASCADE' });
UserFile.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });
UserFile.belongsTo(User, { foreignKey: 'adviser_id', as: 'adviser' });

// Optional (if you added before)
if (Appointment) {
  User.hasMany(Appointment, { foreignKey: 'farmer_id', as: 'appointments_as_farmer', onDelete: 'CASCADE' });
  User.hasMany(Appointment, { foreignKey: 'adviser_id', as: 'appointments_as_adviser', onDelete: 'CASCADE' });
  Appointment.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });
  Appointment.belongsTo(User, { foreignKey: 'adviser_id', as: 'adviser' });
}

if (Fertilizer) {
  User.hasMany(Fertilizer, { foreignKey: 'user_id', as: 'fertilizers', onDelete: 'CASCADE' });
  Fertilizer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
}

// 🔹 Cultivations
User.hasMany(Cultivation, { foreignKey: 'user_id', as: 'cultivations', onDelete: 'CASCADE' });
Cultivation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  PredictionHistory,
  Message,
  MessageFile,
  UserFile,
  Appointment,
  Fertilizer,
  Cultivation, // 🔹 export
};
