const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  try {
    const manager_id = event.queryStringParameters?.manager_id || event.pathParameters?.manager_id;

    const result = await ddb.send(new ScanCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      FilterExpression: "#status = :sub AND manager_id = :mid",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":sub": "submitted",
        ":mid": manager_id || "MGR001"
      }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ pending: result.Items || [] })
    };
  } catch (err) {
    console.error("Error in getPendingApprovals:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: err.message })
    };
  }
};
