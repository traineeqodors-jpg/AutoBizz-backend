"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Document.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
      });
    }
  }
  Document.init(
    {
      docType: DataTypes.STRING,
      docUrl: DataTypes.STRING,
      orgId: DataTypes.INTEGER,
      pineconeId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Stores the file_uuid used in Pinecone",
      },
    },
    {
      sequelize,
      modelName: "Document",
    },
  );
  return Document;
};