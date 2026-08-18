const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({});

exports.handler = async (event) => {
  try {
    const { request, reason } = event;
    const { employee_id, request_id, leave_type, num_days } = request || {};

    const hrEmail = process.env.HR_ADMIN_EMAIL || "hr@leavemgmt.example.com";
    const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@leavemgmt.example.com";

    const subject = `[ESCALATED] Manager Inaction (48h) on Leave Request ${request_id}`;
    const bodyText = `ATTENTION HR ADMIN,

The following leave request has timed out after 48 hours without a manager response:
- Employee ID: ${employee_id}
- Request ID: ${request_id}
- Leave Type: ${leave_type}
- Duration: ${num_days} day(s)
- Escalation Reason: ${reason || "Manager did not respond within 48h SLA"}

This request has now been escalated directly to HR for review and decision.`;

    await ses.send(new SendEmailCommand({
      Source: senderEmail,
      Destination: { ToAddresses: [hrEmail] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: bodyText } }
      }
    }));

    return { status: "escalated_to_hr" };
  } catch (err) {
    console.error("Error in notifyHREscalation:", err);
    throw err;
  }
};
