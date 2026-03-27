const { google } = require("googleapis");
 
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage",
);
 
/**
* Adds an event to the user's Google Calendar
* @param {string} refreshToken - The stored refresh token from your DB
* @param {object} eventDetails - { title, description, startTime, endTime }
*/
const addCalendarEvent = async (refreshToken, eventDetails) => {
  try {
    // Set the stored refresh token
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
 
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
 
    const response = await calendar.events.insert({
      calendarId: "primary",
      // This is required to get a Meet link (optional)
      conferenceDataVersion: 1,
      resource: {
        summary: eventDetails.title,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.startTime, // Must be ISO 8601 string
          timeZone: "UTC",
        },
        end: {
          dateTime: eventDetails.endTime,
          timeZone: "UTC",
        },
        // Optional: Adds a Google Meet link
        conferenceData: {
          createRequest: { requestId: `req-${Date.now()}` },
        },
      },
    });
 
    return response.data;
  } catch (error) {
    console.error("Google Service Error:", error);
    throw error;
  }
};
 
module.exports = { oauth2Client, addCalendarEvent };
 