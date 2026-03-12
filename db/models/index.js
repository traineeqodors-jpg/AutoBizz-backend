'use strict';

const Sequelize = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};


db.Organization = require('./organization')(sequelize, Sequelize.DataTypes);
db.Tenant = require("./tenant")(sequelize, Sequelize.DataTypes);
db.PasswordReset = require("./passwordreset")(sequelize, Sequelize.DataTypes);
db.Document = require("./document")(sequelize, Sequelize.DataTypes);
db.OrganizationDetail = require("./organizationdetail")(sequelize , Sequelize.DataTypes)
db.CallLog = require("./calllog")(sequelize ,Sequelize.DataTypes )


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
