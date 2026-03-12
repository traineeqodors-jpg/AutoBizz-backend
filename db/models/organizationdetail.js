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
      allowNull: true,
      
    },
   startedInYear: {
  type: DataTypes.INTEGER,
  allowNull: true,
  
},
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      
    },
    sop: {
      type: DataTypes.TEXT,
      allowNull: true,
      
    }
  }, {
    sequelize,
    modelName: 'OrganizationDetail',
    tableName : "OrganizationDetails"
  });

  return OrganizationDetail;
};
