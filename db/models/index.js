"use strict";

const Sequelize = require("sequelize");
const process = require("process");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const db = {};

db.Organization = require("./organization")(sequelize, Sequelize.DataTypes);
db.PasswordReset = require("./passwordreset")(sequelize, Sequelize.DataTypes);
db.Document = require("./document")(sequelize, Sequelize.DataTypes);
db.OrganizationDetail = require("./organizationdetail")(
  sequelize,
  Sequelize.DataTypes,
);
db.CallLog = require("./calllog")(sequelize, Sequelize.DataTypes);
db.Sop = require("./sop")(sequelize, Sequelize.DataTypes);
db.Lead = require("./lead")(sequelize, Sequelize.DataTypes);
db.Meeting = require("./meeting")(sequelize, Sequelize.DataTypes);
db.Employee = require("./employee")(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
