const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  try {
    const employee_id = event.queryStringParameters?.employee_id || event.pathParameters?.employee_id;

    if (!employee_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "employee_id parameter is required" })
      };
    }

    const result = await ddb.send(new QueryCommand({
      TableName: process.env.LEAVE_BALANCES_TABLE || "leave_balances",
      KeyConditionExpression: "employee_id = :eid",
      ExpressionAttributeValues: { ":eid": employee_id }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ balances: result.Items || [] })
    };
  } catch (err) {
    console.error("Error in getEmployeeBalances:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: err.message })
    };
  }
};
