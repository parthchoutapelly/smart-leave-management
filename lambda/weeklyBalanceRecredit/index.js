const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

exports.handler = async () => {
  try {
    console.log("Starting weekly balance summary & carry-forward audit job...");

    const balances = await ddb.send(new ScanCommand({
      TableName: process.env.LEAVE_BALANCES_TABLE || "leave_balances"
    }));

    const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@leavemgmt.example.com";
    const employeeEmail = process.env.TEST_EMPLOYEE_EMAIL || "employee@example.com";

    // Summarize and send notification
    for (const item of (balances.Items || [])) {
      try {
        await ses.send(new SendEmailCommand({
          Source: senderEmail,
          Destination: { ToAddresses: [employeeEmail] },
          Message: {
            Subject: { Data: `[Weekly Update] Leave Balance Summary for ${item.employee_id}` },
            Body: {
              Text: {
                Data: `Hello ${item.employee_id},\n\nHere is your current leave balance summary for ${item.year}:\n- Type: ${item.leave_type}\n- Total Quota: ${item.total_quota}\n- Used: ${item.used}\n- Remaining: ${item.remaining}\n- Carry Forward: ${item.carry_forward}\n\nHave a great week!`
              }
            }
          }
        }));
      } catch (emailErr) {
        console.warn(`Could not send email for ${item.employee_id}:`, emailErr.message);
      }
    }

    return { status: "completed", processedCount: balances.Items?.length || 0 };
  } catch (err) {
    console.error("Error in weeklyBalanceRecredit:", err);
    throw err;
  }
};
