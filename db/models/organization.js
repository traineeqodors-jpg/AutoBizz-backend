"use strict";
const { Model } = require("sequelize");
const { hashPassword, comparePassword } = require("../../src/utils/authHelper");
const jwt = require("jsonwebtoken");

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 */

module.exports = (sequelize, DataTypes) => {
  class Organization extends Model {
    static associate(models) {
      Organization.hasMany(models.PasswordReset, {
        foreignKey: "orgId",
        as: "passwordResets",
      });

      Organization.hasMany(models.Document, {
        foreignKey: "orgId",
        as: "documents",
        onDelete: "CASCADE",
      });

      Organization.hasOne(models.OrganizationDetail, {
        foreignKey: "orgId",
        as: "details",
      });
    }

    async validPassword(password) {
      return await comparePassword(password, this.password);
    }
  }
  Organization.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "First name is required" },
          len: [2, 50],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Last name is required" },
        },
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Company name is required" },
        },
      },
      businessSize: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
        },
      },
      country: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: "Please provide a valid email address" },
          notNull: { msg: "Email cannot be null" },
        },
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
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refreshToken: DataTypes.TEXT,
      role: {
        type: DataTypes.ENUM("admin", "owner", "user"),
        defaultValue: "user",
        allowNull: false,
        validate: {
          isIn: {
            args: [["admin", "owner", "user"]],
            msg: "Invalid role selected",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Organization",
      tableName: "Organizations",
      hooks: {
        beforeSave: async (organization) => {
          if (organization.changed("password")) {
            organization.password = await hashPassword(organization.password);
          }
        },
      },
    },
  );

  Organization.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        businessName: this.businessName,
        email: this.email,
        role: this.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      },
    );
  };

  Organization.prototype.generateRefreshToken = function () {
    return jwt.sign(
      {
        id: this.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      },
    );
  };

  return Organization;
};
