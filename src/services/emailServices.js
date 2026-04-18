const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-tokken";

const generateLeadToken = (leadId) => {
  return jwt.sign({ leadId }, JWT_SECRET, { expiresIn: "1d" });
};

const baseEmailTemplate = ({ title, bodyContent }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                max-width: 600px; 
                margin: 0 auto; 
                border: 1px solid #e0e0e0; 
                border-radius: 12px; 
                overflow: hidden; 
            }
            .header { 
                background-color: #eaf0ff; 
                padding: 10px 5px; 
                text-align: center; 
                color: #3c6ce4; 
            }
            .content { 
                padding: 40px 30px; 
                line-height: 1.6; 
                color: #374151; 
            }
            .button-wrapper { 
                text-align: center; 
                margin: 30px 0; 
            }
            .button { 
                background-color: #3c6ce4; 
                color: white !important; 
                padding: 14px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold; 
                display: inline-block; 
            }
            .footer { 
                background-color: #f9fafb; 
                padding: 20px; 
                text-align: center; 
                font-size: 12px; 
                color: #6b7280; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img 
                    src="https://raw.githubusercontent.com/traineeqodors-jpg/AutoBizz-frontend/refs/heads/development/public/logo.png" 
                    alt="Company Logo" 
                    style="max-width: 120px; margin-bottom: 15px;" 
                />
                <h1 style="margin:0;">${title}</h1>
            </div>

            <div class="content">
                ${bodyContent}
            </div>

            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} AutoBizz. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInterestEmail = async (
  leadEmail,
  token,
  managerName,
  managerEmail,
) => {
  const confirmUrl = `${process.env.FRONTEND_URL}/confirm-meeting?token=${token}&interested=true`;
  const declineUrl = `${process.env.FRONTEND_URL}/confirm-meeting?token=${token}&interested=false`;

  try {
    const info = await transporter.sendMail({
      from: `"${managerName}" <${managerEmail}>`,
      to: leadEmail,
      subject: `Meeting Request from ${managerName}`,
      html: `
         <p>Hi, I'm <strong>${managerName}</strong>. Based on your recent activity, I'd love to schedule a quick meeting.</p>
         <p>Are you interested?</p>
         
         <div style="margin-top: 20px;">
           <a href="${confirmUrl}" style="background: #28a745; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
             Yes, Let's Chat
           </a>
           <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px;">
             No, Not Right Now
           </a>
         </div>
         
         <p style="margin-top: 30px; font-size: 12px; color: #666;">
           Best,<br>${managerName}<br>${managerEmail}
         </p>
       `,
    });
    console.log("SUCCESS:", info.response);
  } catch (error) {
    console.error("SMTP ERROR:", error);
  }
};

const sendMeetingConfirmationEmail = async (
  leadEmail,
  meetingDetails,
  managerName,
) => {
  const { title, startTime, meetLink } = meetingDetails;
  const formattedDate = new Date(startTime).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const info = await transporter.sendMail({
      from: `"${managerName}" <${process.env.SMTP_USER}>`,
      to: leadEmail,
      subject: `Confirmed: ${title}`,
      html: `
         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
           <div style="background-color: #4285f4; padding: 20px; text-align: center; color: white;">
             <h2 style="margin: 0;">Meeting Confirmed</h2>
           </div>
           <div style="padding: 30px; background-color: #ffffff;">
             <p style="font-size: 16px; color: #333;">Hi there,</p>
             <p style="color: #5f6368; line-height: 1.5;">Your discovery call has been successfully scheduled. Here are the details:</p>
             
             <div style="background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 15px; margin: 20px 0;">
               <p style="margin: 5px 0;"><strong>Event:</strong> ${title}</p>
               <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
               <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
             </div>
   
             <div style="text-align: center; margin-top: 30px;">
               <a href="${meetLink}" style="background-color: #1a73e8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                 Join with Google Meet
               </a>
             </div>
   
             <p style="margin-top: 30px; font-size: 14px; color: #70757a; text-align: center;">
               The invite has also been added to your calendar.
             </p>
           </div>
           <div style="background-color: #f1f3f4; padding: 15px; text-align: center; font-size: 12px; color: #70757a;">
             Sent by ${managerName} via LeadFlow CRM
           </div>
         </div>
       `,
    });
    console.log("SUCCESS:", info.response);
  } catch (error) {
    console.error("SMTP ERROR:", error);
  }
};

const sendResetPasswordLink = async (token, email, firstName = "User") => {
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${token}`;

  const bodyContent = `
    <p>Hello <strong>${firstName}</strong>,</p>
    
    <p>
        We received a request to reset your account password. 
        Click the button below to set a new password. 
        This link is valid for <strong>1 hour</strong>.
    </p>

    <div class="button-wrapper">
        <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #3c6ce4;">
        ${resetUrl}
    </p>

    <p>
        If you did not request this, you can safely ignore this email. 
        Your password will remain unchanged.
    </p>
    
    <p>Regards,<br><strong>Support Team</strong></p>
  `;

  const htmlContent = baseEmailTemplate({
    title: "Reset Your Password",
    bodyContent,
  });

  try {
    await transporter.sendMail({
      from: `"Admin Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: htmlContent,
    });
  } catch (error) {
    console.error("SMTP ERROR:", error);
  }
};

const sendQueryMail = async (to, data) => {
  const { name, email, subject, message, phone } = data;

  const bodyContent = `
    <div style="margin-bottom: 20px;">
        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            From
        </span>
        <span style="font-size: 18px; color: #111827;">
            ${name}
        </span>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1;">
            <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                Email
            </span>
            <a href="mailto:${email}" style="font-size: 16px; color: #3c6ce4; text-decoration: none;">
                ${email}
            </a>
        </div>

        <div style="flex: 1;">
            <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                Phone
            </span>
            <span style="font-size: 16px; color: #111827;">
                ${phone}
            </span>
        </div>
    </div>

    <div style="margin-bottom: 20px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Subject
        </span>
        <span style="font-size: 16px; color: #111827; font-weight: 500;">
            ${subject}
        </span>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3c6ce4;">
        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px;">
            Message
        </span>
        <p style="font-size: 15px; color: #374151; margin: 0; line-height: 1.6;">
            ${message}
        </p>
    </div>
  `;

  const htmlContent = baseEmailTemplate({
    title: "New Business Inquiry",
    bodyContent,
  });

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to,
      subject: `New Inquiry: ${subject}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("SMTP ERROR:", error);
  }
};

const sendInvitationEmail = async (email, firstName, setupUrl) => {
  const bodyContent = `
    <p>Hello <strong>${firstName}</strong>,</p>

    <p>
        An account has been created for you at our organization. 
        We are excited to have you on board! To get started and access your dashboard, 
        you need to secure your account by setting up a password.
    </p>

    <div class="button-wrapper">
        <a href="${setupUrl}" class="button">Set Up Your Password</a>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>

    <p style="word-break: break-all; font-size: 13px; color: #3c6ce4;">
        ${setupUrl}
    </p>

    <p>
        Regards,<br>
        <strong>Operations Team</strong>
    </p>
  `;

  const htmlContent = baseEmailTemplate({
    title: "Welcome to the Team!",
    bodyContent,
  });

  try {
    return await transporter.sendMail({
      from: `"Admin Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Set up your account password",
      html: htmlContent,
    });
  } catch (error) {
    console.error("SMTP ERROR:", error);
  }
};

module.exports = {
  generateLeadToken,
  sendInterestEmail,
  sendMeetingConfirmationEmail,
  sendResetPasswordLink,
  sendQueryMail,
  sendInvitationEmail,
};
