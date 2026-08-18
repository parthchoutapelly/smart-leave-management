const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand } = require("@aws-sdk/client-sfn");
const crypto = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sfn = new SFNClient({});

const SECRET = process.env.APPROVAL_SECRET || "default_dev_secret_key_123";

function generateToken(requestId, decision) {
  return crypto.createHmac("sha256", SECRET).update(`${requestId}:${decision}`).digest("hex");
}

function verifyToken(requestId, decision, token) {
  return generateToken(requestId, decision) === token;
}

exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters || {};
    const { token, request_id, employee_id, decision } = query;

    if (!token || !request_id || !decision || !employee_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html" },
        body: "<h1>Invalid Request</h1><p>Missing required parameters.</p>"
      };
    }

    if (!verifyToken(request_id, decision, token)) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "text/html" },
        body: "<h1>Unauthorized</h1><p>Security token verification failed or token is invalid.</p>"
      };
    }

    // Retrieve the Step Functions task token from DynamoDB
    const itemResult = await ddb.send(new GetCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id }
    }));

    if (!itemResult.Item || !itemResult.Item.sfn_task_token) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "text/html" },
        body: "<h1>Request Not Found or Already Processed</h1><p>Could not find an active approval task token.</p>"
      };
    }

    const taskToken = itemResult.Item.sfn_task_token;

    // Send task response to Step Functions
    await sfn.send(new SendTaskSuccessCommand({
      taskToken: taskToken,
      output: JSON.stringify({
        employee_id,
        request_id,
        leave_type: itemResult.Item.leave_type,
        num_days: itemResult.Item.num_days,
        decision: decision
      })
    }));

    // Update status in DynamoDB
    await ddb.send(new UpdateCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Key: { employee_id, request_id },
      UpdateExpression: "SET #status = :s, updated_at = :t REMOVE sfn_task_token",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":s": decision === "approved" ? "manager_approved" : "rejected",
        ":t": new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<h1>Decision Recorded</h1><p>Leave request <strong>${request_id}</strong> has been successfully marked as <strong>${decision}</strong>.</p>`
    };
  } catch (err) {
    console.error("Error in processApprovalDecision:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html" },
      body: `<h1>Error Processing Decision</h1><p>${err.message}</p>`
    };
  }
};
