const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

exports.handler = async (event) => {
  try {
    const { employee_id, request_id, leave_type, num_days, reason } = event;

    // 1. Mark request as rejected
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id },
      UpdateExpression: "SET #status = :s, rejection_reason = :r, updated_at = :t",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":s": "rejected",
        ":r": reason || "Rejected during approval workflow",
        ":t": new Date().toISOString()
      }
    }));

    // 2. Send rejection email via SES
    const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@leavemgmt.example.com";
    const employeeEmail = process.env.TEST_EMPLOYEE_EMAIL || "employee@example.com";

    await ses.send(new SendEmailCommand({
      Source: senderEmail,
      Destination: { ToAddresses: [employeeEmail] },
      Message: {
        Subject: { Data: `[Update] Leave Request ${request_id} was Rejected` },
        Body: {
          Text: {
            Data: `Hello,\n\nYour leave request (${request_id}) for ${num_days} days of ${leave_type} leave has been rejected.\nReason: ${reason || "Not approved by reviewer."}\nYour balance remains untouched.\n\nRegards,\nLeave Management Team`
          }
        }
      }
    }));

    return { status: "rejected_notified", request_id };
  } catch (err) {
    console.error("Error in notifyRejected:", err);
    throw err;
  }
};
