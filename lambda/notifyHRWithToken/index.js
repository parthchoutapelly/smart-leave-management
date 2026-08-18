const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const crypto = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

const SECRET = process.env.APPROVAL_SECRET || "default_dev_secret_key_123";
const API_BASE_URL = process.env.API_GATEWAY_URL || "https://api.example.com/prod";

function generateToken(requestId, decision) {
  return crypto.createHmac("sha256", SECRET).update(`${requestId}:${decision}`).digest("hex");
}

exports.handler = async (event) => {
  try {
    const { taskToken, request } = event;
    const { employee_id, request_id, leave_type, num_days } = request;

    // 1. Update task token in DynamoDB
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id },
      UpdateExpression: "SET sfn_task_token = :tk, updated_at = :t",
      ExpressionAttributeValues: {
        ":tk": taskToken,
        ":t": new Date().toISOString()
      }
    }));

    // 2. Generate signed links for HR
    const approveToken = generateToken(request_id, "approved");
    const rejectToken = generateToken(request_id, "rejected");

    const approveUrl = `${API_BASE_URL}/approve?request_id=${request_id}&employee_id=${employee_id}&decision=approved&token=${approveToken}`;
    const rejectUrl = `${API_BASE_URL}/reject?request_id=${request_id}&employee_id=${employee_id}&decision=rejected&token=${rejectToken}`;

    const hrEmail = process.env.HR_ADMIN_EMAIL || "hr@leavemgmt.example.com";
    const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@leavemgmt.example.com";

    const bodyText = `HR Approval Required:
----------------------------------------
Employee ID: ${employee_id}
Request ID: ${request_id}
Leave Type: ${leave_type}
Duration: ${num_days} day(s) (Exceeds 5-day threshold or Manager Escalation)

Decision Links:
Approve: ${approveUrl}
Reject: ${rejectUrl}`;

    await ses.send(new SendEmailCommand({
      Source: senderEmail,
      Destination: { ToAddresses: [hrEmail] },
      Message: {
        Subject: { Data: `[HR Action Required] Leave Request ${request_id} from ${employee_id}` },
        Body: { Text: { Data: bodyText } }
      }
    }));

    return { status: "hr_notified" };
  } catch (err) {
    console.error("Error in notifyHRWithToken:", err);
    throw err;
  }
};
