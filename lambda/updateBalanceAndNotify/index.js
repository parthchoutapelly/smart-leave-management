const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

exports.handler = async (event) => {
  try {
    const { employee_id, request_id, leave_type, num_days } = event;
    const year = 2026;

    // 1. Decrement remaining balance and increment used balance
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_BALANCES_TABLE || "leave_balances",
      Key: { employee_id, leave_type_year: `${leave_type}#${year}` },
      UpdateExpression: "SET used = used + :n, remaining = remaining - :n, updated_at = :t",
      ExpressionAttributeValues: {
        ":n": num_days,
        ":t": new Date().toISOString()
      }
    }));

    // 2. Mark request as fully approved
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id },
      UpdateExpression: "SET #status = :s, updated_at = :t",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":s": "approved",
        ":t": new Date().toISOString()
      }
    }));

    // 3. Send confirmation email via SES
    const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@leavemgmt.example.com";
    const employeeEmail = process.env.TEST_EMPLOYEE_EMAIL || "employee@example.com";

    await ses.send(new SendEmailCommand({
      Source: senderEmail,
      Destination: { ToAddresses: [employeeEmail] },
      Message: {
        Subject: { Data: `[Approved] Leave Request ${request_id} has been Approved` },
        Body: {
          Text: {
            Data: `Hello,\n\nYour leave request (${request_id}) for ${num_days} days of ${leave_type} leave has been fully approved.\nYour leave balance has been updated accordingly.\n\nRegards,\nHR & Leave Management System`
          }
        }
      }
    }));

    return { status: "success", request_id, employee_id };
  } catch (err) {
    console.error("Error in updateBalanceAndNotify:", err);
    throw err;
  }
};
