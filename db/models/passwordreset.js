'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {
    static associate(models) {
     
      PasswordReset.belongsTo(models.Organization, {
        foreignKey: 'orgId',
        as: 'organization'
      });
    }
  }
  PasswordReset.init({
    token: DataTypes.STRING,
    orgId: DataTypes.INTEGER,
    expiresIn: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'PasswordResets'
  });
  return PasswordReset;
};
