'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrganizationDetail extends Model {
    static associate(models) {
      OrganizationDetail.belongsTo(models.Organization, {
        foreignKey: 'orgId',
        as: 'organization',
        onDelete: 'CASCADE'
      });
    }
  }

  OrganizationDetail.init({
    orgId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: { msg: "This organization already has details." },
      validate: {
        notNull: { msg: "Organization ID is required" }
      }
    },
    orgCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Organization Category cannot be empty" },
        len: { args: [2, 50], msg: "Category must be between 2 and 50 characters" }
      }
    },
   startedInYear: {
  type: DataTypes.INTEGER,
  allowNull: false,
  validate: {
    isInt: { msg: "Please provide a valid year (e.g., 2024)" },
    min: {
      args: [1000], // Ensures at least a 4-digit year
      msg: "Year must be a 4-digit number"
    },
    max: {
      args: [new Date().getFullYear()],
      msg: "Start year cannot be in the future"
    }
  }
},
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Description is required" },
        len: { args: [10, 500], msg: "Description should be between 10 and 500 characters" }
      }
    },
    businessSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        
        len: { args: [0, 5000], msg: "Summary exceeds maximum character limit" }
      }
    }
  }, {
    sequelize,
    modelName: 'OrganizationDetail',
    tableName : "OrganizationDetails"
  });

  return OrganizationDetail;
};
