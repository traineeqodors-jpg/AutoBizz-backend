const { google } = require("googleapis");
 
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage",
);

const addCalendarEvent = async (refreshToken, eventDetails) => {
  try {
 
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
 
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
 
    const response = await calendar.events.insert({
      calendarId: "primary",
     
      conferenceDataVersion: 1,
      resource: {
        summary: eventDetails.title,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.startTime, 
          timeZone: "UTC",
        },
        end: {
          dateTime: eventDetails.endTime,
          timeZone: "UTC",
        },
 
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

const deleteCalendarEvent = async (refreshToken, eventId) => {
  

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
   
    console.error("Google Calendar Deletion Error:", error.message);
    return false;
  }
};
 
module.exports = { oauth2Client, addCalendarEvent , deleteCalendarEvent };
 