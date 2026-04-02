"use strict";
const { Model } = require("sequelize");
const {
  addCalendarEvent,
} = require("../../src/services/googleCalender.services");
const { generateLeadToken, sendInterestEmail } = require("../../src/services/emailServices");
module.exports = (sequelize, DataTypes) => {
  class Lead extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Lead.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
      });

      Lead.hasMany(models.Meeting, {
        foreignKey: "leadId",
        as: "meetings",
        onDelete: "SET NULL",
      });
      Lead.hasMany(models.CallLog, {
        foreignKey: "leadId",
        as: "callLogs",
      });
    }
  }
  Lead.init(
    {
      orgId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      company: DataTypes.STRING,
      status: DataTypes.STRING,
      confidence_score: DataTypes.INTEGER,
      meeting_scheduled: DataTypes.BOOLEAN,
      metadata: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "Lead",
      hooks: {
        afterBulkUpdate: (options) => {
          options.individualHooks = true;
        },
        afterUpdate: async (lead , options) => {
          if (lead.confidence_score >= 80 && !lead.meeting_scheduled) {
            try {
              const Organization = lead.sequelize.models.Organization;

              const org = await Organization.findByPk(lead.orgId);

              if (!org || !org.googleRefreshToken) {
                return;
              }

              const token = generateLeadToken(lead.id);

              console.log("Sending Mail")

              await sendInterestEmail(
                lead.email,
                token,
                org.businessName,
                org.email,
              );
            } catch (error) {
              console.error("Hook Automation Error:", error.message);
            }
          }
        },
      },
    },
  );
  return Lead;
};
