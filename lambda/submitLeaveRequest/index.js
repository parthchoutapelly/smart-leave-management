const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const { randomUUID } = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sfn = new SFNClient({});

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

function datesOverlap(startA, endA, startB, endB) {
  return new Date(startA) <= new Date(endB) && new Date(startB) <= new Date(endA);
}

exports.handler = async (event) => {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const { employee_id, leave_type, start_date, end_date, manager_id, reason } = body;

    if (!employee_id || !leave_type || !start_date || !end_date || !manager_id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing required fields in payload" })
      };
    }

    const numDays = calculateDays(start_date, end_date);
    const requestId = `REQ-${Date.now()}-${randomUUID().substring(0, 5)}`;
    const currentYear = new Date(start_date).getFullYear() || 2026;

    // 1. Fetch balance
    const balanceResult = await ddb.send(new GetCommand({
      TableName: process.env.LEAVE_BALANCES_TABLE || "leave_balances",
      Key: { employee_id, leave_type_year: `${leave_type}#${currentYear}` }
    }));

    const remaining = balanceResult.Item?.remaining ?? 0;

    // 2. Validate sufficient balance
    if (remaining < numDays) {
      await ddb.send(new PutCommand({
        TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
        Item: {
          employee_id,
          request_id: requestId,
          leave_type,
          start_date,
          end_date,
          num_days: numDays,
          status: "rejected",
          reason: reason || "",
          rejection_reason: "insufficient balance",
          manager_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          status: "rejected",
          request_id: requestId,
          reason: "insufficient balance",
          remaining_balance: remaining,
          requested_days: numDays
        })
      };
    }

    // 3. Check for overlapping approved leave
    const existing = await ddb.send(new QueryCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      KeyConditionExpression: "employee_id = :eid",
      FilterExpression: "#status IN (:app1, :app2, :app3)",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":eid": employee_id,
        ":app1": "manager_approved",
        ":app2": "hr_approved",
        ":app3": "approved"
      }
    }));

    const hasConflict = (existing.Items || []).some(item =>
      datesOverlap(start_date, end_date, item.start_date, item.end_date)
    );

    if (hasConflict) {
      await ddb.send(new PutCommand({
        TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
        Item: {
          employee_id,
          request_id: requestId,
          leave_type,
          start_date,
          end_date,
          num_days: numDays,
          status: "rejected",
          reason: reason || "",
          rejection_reason: "overlapping leave dates",
          manager_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          status: "rejected",
          request_id: requestId,
          reason: "overlapping leave dates"
        })
      };
    }

    // 4. Save new request in 'submitted' status
    await ddb.send(new PutCommand({
      TableName: process.env.LEAVE_REQUESTS_TABLE || "leave_requests",
      Item: {
        employee_id,
        request_id: requestId,
        leave_type,
        start_date,
        end_date,
        num_days: numDays,
        status: "submitted",
        manager_id,
        reason: reason || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 5. Trigger Step Functions execution
    if (process.env.STATE_MACHINE_ARN) {
      await sfn.send(new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        name: `exec-${requestId}`,
        input: JSON.stringify({
          employee_id,
          request_id: requestId,
          leave_type,
          start_date,
          end_date,
          num_days: numDays,
          manager_id,
          reason
        })
      }));
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        status: "submitted",
        request_id: requestId,
        message: "Leave request submitted successfully"
      })
    };
  } catch (err) {
    console.error("Error in submitLeaveRequest:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal server error", error: err.message })
    };
  }
};
