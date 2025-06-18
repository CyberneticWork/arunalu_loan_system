import { connectDB } from "@/lib/db";

export async function GET(req, context) {
  let connection;
  try {
    const params = await context.params;
    const { nic } = params;
    if (!nic) {
      return Response.json(
        { error: "NIC is required", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }
    connection = await connectDB();
    // Fetch customer
    const [custRows] = await connection.execute(
      "SELECT c.*, b.branch AS branch_name, b.shortcode FROM customer c LEFT JOIN branches b ON c.location = b.shortcode WHERE nic = ?",
      [nic]
    );
    if (custRows.length === 0) {
      await connection.end();
      return Response.json(
        { error: "Customer not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const customer = custRows[0];
    // Fetch spouse by customer id
    const [spouseRows] = await connection.execute(
      "SELECT * FROM spouse WHERE customers = ? LIMIT 1",
      [customer.id]
    );
    const spouse = spouseRows.length > 0 ? spouseRows[0] : null;
    await connection.end();
    return Response.json(
      { customer, spouse, code: "SUCCESS" },
      { status: 200 }
    );
  } catch (error) {
    if (connection)
      try {
        await connection.end();
      } catch (e) {}
    console.error("Customer GET API Error:", error);
    return Response.json(
      { error: error.message, code: error.code || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
