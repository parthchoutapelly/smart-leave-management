const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const crypto = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

const SECRET = process.env.APPROVAL_SECRET || "default_dev_secret_key_123";
const API_BASE_URL = process.env.API_GATEWAY_URL || "https://api.example.com/prod";

function generateToken(requestId, decision) {
  return crypto.createHmac("sha256", SECRET).update(`${requestId}:${decision}`).digest("hex");
}

exports.handler = async (event) => {
  try {
    const { taskToken, request } = event;
    const { employee_id, request_id, leave_type, num_days, start_date, end_date, reason } = request;

    // 1. Store task token in DynamoDB
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id },
      UpdateExpression: "SET sfn_task_token = :tk, updated_at = :t",
      ExpressionAttributeValues: {
        ":tk": taskToken,
        ":t": new Date().toISOString()
      }
    }));

    // 2. Generate signed approval & rejection URLs
    const approveToken = generateToken(request_id, "approved");
    const rejectToken = generateToken(request_id, "rejected");

    const approveUrl = `${API_BASE_URL}/approve?request_id=${request_id}&employee_id=${employee_id}&decision=approved&token=${approveToken}`;
    const rejectUrl = `${API_BASE_URL}/reject?request_id=${request_id}&employee_id=${employee_id}&decision=rejected&token=${rejectToken}`;

    const message = `New Leave Request Pending Approval:
----------------------------------------
Employee ID: ${employee_id}
Request ID: ${request_id}
Leave Type: ${leave_type}
Duration: ${num_days} day(s) (${start_date} to ${end_date})
Reason: ${reason || "N/A"}

Action Links (Valid for this workflow execution):
Approve: ${approveUrl}
Reject: ${rejectUrl}

Note: If no action is taken within 48 hours, this request will automatically escalate to HR.`;

    // 3. Publish to SNS
    if (process.env.MANAGER_NOTIFY_TOPIC_ARN) {
      await sns.send(new PublishCommand({
        TopicArn: process.env.MANAGER_NOTIFY_TOPIC_ARN,
        Subject: `[Action Required] Leave Request ${request_id} from ${employee_id}`,
        Message: message
      }));
    }

    return { status: "notified" };
  } catch (err) {
    console.error("Error in notifyManagerWithToken:", err);
    throw err;
  }
};
