"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sop.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
      });
    }
  }
  Sop.init(
    {
      videoId: DataTypes.STRING,
      videoScript: DataTypes.TEXT,
      videoUrl: DataTypes.STRING,
      orgId: DataTypes.INTEGER,
      videoTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Untitled SOP",
      },
    },
    {
      sequelize,
      modelName: "Sop",
    },
  );
  return Sop;
};
