"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrganizationDetail extends Model {
    static associate(models) {
      OrganizationDetail.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
        onDelete: "CASCADE",
      });
    }
  }

  OrganizationDetail.init(
    {
      orgId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: { msg: "This organization already has details." },
      },
      orgCategory: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startedInYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sop: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OrganizationDetail",
      tableName: "OrganizationDetails",
    },
  );

  return OrganizationDetail;
};
