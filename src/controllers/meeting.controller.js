const db = require("../../db/models");
const Meeting = db.Meeting;
const Lead = db.Lead;
const Organization = db.Organization;

const { Op } = require("sequelize");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  addCalendarEvent,
  deleteCalendarEvent,
} = require("../services/googleCalender.services");
const jwt = require("jsonwebtoken");
const { sendMeetingConfirmationEmail } = require("../services/emailServices");

const getAllMeetings = asyncHandler(async (req, res) => {
  const orgId = req.organization?.id || req.employee?.orgId ;

  const { startDate, endDate, limit = 50, page = 1 } = req.query;

  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to fetch meetings");
  }

  const queryConditions = { orgId };

  if (startDate && endDate) {
    queryConditions.startTime = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Meeting.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["startTime", "ASC"]],
    include: [
      {
        model: Lead,
        as: "lead",
        attributes: ["id", "name", "email", "company", "status"],
      },
    ],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meetings: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
        },
      },
      "Meetings retrieved successfully",
    ),
  );
});

const confirmMeeting = asyncHandler(async (req, res) => {
  const { token, interested } = req.body;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const lead = await Lead.findByPk(decoded.leadId);

  if (!lead) {
    throw new ApiError(404, "Lead Not Found");
  }

  if (lead.meeting_scheduled) {
    return res.json(
      new ApiResponse(
        200,
        { interested: true, alreadyScheduled: true },
        "Meeting is already on your calendar.",
      ),
    );
  }

  if (interested) {
    const org = await Organization.findByPk(lead.orgId);
    if (!org || !org.googleRefreshToken) {
      throw new ApiError(400, "Manager's calendar is not connected.");
    }

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const eventDetails = {
      title: `Discovery Call: ${lead.name} (${lead.company || "New Lead"})`,
      description: `Automated meeting for high-intent lead. Score: ${lead.confidence_score}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    const calendarData = await addCalendarEvent(
      org.googleRefreshToken,
      eventDetails,
    );

    const oldMeeting = await Meeting.findOne({
      where: {
        leadId: lead.id,
      },
    });

    if (oldMeeting) {
      try {
        const org = await Organization.findByPk(lead.orgId);
        if (org?.googleRefreshToken && oldMeeting.googleEventId) {
          await deleteCalendarEvent(
            org.googleRefreshToken,
            oldMeeting.googleEventId,
          );
        }

        await oldMeeting.destroy();
        console.log(`Deleted old meeting for lead ${lead.id}`);
      } catch (err) {
        console.error("Error cleaning up old meeting:", err.message);
      }
    }

    const meeting = await Meeting.create({
      googleEventId: calendarData.id,
      title: eventDetails.title,
      description: eventDetails.description,
      startTime: startTime,
      endTime: endTime,
      meetLink: calendarData.hangoutLink || calendarData.htmlLink,
      orgId: lead.orgId,
      leadId: lead.id,
    });

    if (!meeting) {
      throw new ApiError(400, "Could not create meeting record.");
    }

    await sendMeetingConfirmationEmail(
      lead.email,
      {
        title: meeting.title,
        startTime: meeting.startTime,
        meetLink: meeting.meetLink,
      },
      org.businessName,
    );

    await lead.update({ meeting_scheduled: true }, { hooks: false });

    return res.json(
      new ApiResponse(
        200,
        { interested: true },
        "Meeting Scheduled Successfully",
      ),
    );
  } else {
    await lead.update(
      {
        meeting_scheduled: false,
        confidence_score: lead.confidence_score - 20,
      },

      { hooks: false },
    );

    return res.json(
      new ApiResponse(200, { interested: false }, "Lead Opted Out"),
    );
  }
});

module.exports = { getAllMeetings, confirmMeeting };
