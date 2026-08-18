const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async () => {
  try {
    const result = await ddb.send(new ScanCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      FilterExpression: "#status = :app",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":app": "approved" }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ approved_leaves: result.Items || [] })
    };
  } catch (err) {
    console.error("Error in getApprovedLeaveForTeam:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: err.message })
    };
  }
};
