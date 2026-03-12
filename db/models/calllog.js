"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CallLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CallLog.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
        onDelete: "CASCADE",
      });
    }
  }
  CallLog.init(
    {
      callSid: DataTypes.STRING,
      from: DataTypes.STRING,
      to: DataTypes.STRING,
      duration: DataTypes.INTEGER,
      status: DataTypes.STRING,
      transcript: DataTypes.TEXT,
      orgId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "CallLog",
    },
  );
  return CallLog;
};
