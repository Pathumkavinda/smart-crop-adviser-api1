const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    landsize: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },

    // Plain string instead of ENUM
    userlevel: {
      type: DataTypes.STRING(50), // flexible string
      allowNull: false,
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
  }
);

module.exports = User;
