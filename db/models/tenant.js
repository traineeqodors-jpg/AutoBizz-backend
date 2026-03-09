'use strict';
const { Model } = require("sequelize");
const { hashPassword, comparePassword } = require("../../src/utils/authHelper");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      // Define associations here
    }

    // Instance method to check password
    async validPassword(password) {
      return await comparePassword(password, this.password);
    }
  }

  Tenant.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "First name is required" }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Last name is required" }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Please provide a valid email address" },
        notNull: { msg: "Email cannot be null" }
      }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: {
            args: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/,
            msg: "Password must be at least 8 characters long and include one number and one special character",
          },
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: {
            args: /^\+[0-9]{1,4}-[0-9]{10}$/,
            msg: "Phone number must follow the format: +countryCode-10digits (e.g., +91-9876543210)",
          },
          
          len: {
            args: [13, 16],
            msg: "Phone number length is invalid",
          },
        },
      },
    refreshToken: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'Tenants',
    hooks: {
      beforeSave: async (tenant) => {
        if (tenant.changed("password")) {
          tenant.password = await hashPassword(tenant.password);
        }
      }
    }
  });

  
  Tenant.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        type: 'tenant' // Useful to distinguish from Organization in middleware
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

  Tenant.prototype.generateRefreshToken = function () {
    return jwt.sign(
      { id: this.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
  };

  return Tenant;
};
