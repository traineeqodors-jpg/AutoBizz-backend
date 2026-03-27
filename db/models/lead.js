"use strict";
const { Model } = require("sequelize");
const {
  addCalendarEvent,
} = require("../../src/services/googleCalender.services");
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
          // Force individual hooks to run if they weren't explicitly set
          options.individualHooks = true;
        },
        afterUpdate: async (lead, options) => {
          if (lead.confidence_score >= 80 && !lead.meeting_scheduled) {
            try {
              const Organization = lead.sequelize.models.Organization;
              const Meeting = lead.sequelize.models.Meeting; // Access the new Meeting model

              const org = await Organization.findByPk(lead.orgId);

              if (!org || !org.googleRefreshToken) {
                return;
              }

              // 1. Prepare Times
              const startTime = new Date();
              startTime.setDate(startTime.getDate() + 1);
              const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

              const eventDetails = {
                title: `Discovery Call: ${lead.name} (${lead.company || "New Lead"})`,
                description: `Automated meeting for high-intent lead. Score: ${lead.confidence_score}`,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
              };

              // 2. Call Google Service
              const calendarData = await addCalendarEvent(
                org.googleRefreshToken,
                eventDetails,
              );

              // 3. STORE MEETING IN DATABASE
              await Meeting.create(
                {
                  googleEventId: calendarData.id,
                  title: eventDetails.title,
                  description: eventDetails.description,
                  startTime: startTime,
                  endTime: endTime,
                  meetLink: calendarData.hangoutLink || calendarData.htmlLink, // Store the Meet or Calendar link
                  orgId: lead.orgId,
                  leadId: lead.id,
                },
                { transaction: options.transaction },
              );

              // 4. Update Lead Flag
              await lead.update(
                { meeting_scheduled: true },
                { hooks: false, transaction: options.transaction },
              );

              console.log(
                `Meeting stored in DB & Created in Google: ${calendarData.htmlLink}`,
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
