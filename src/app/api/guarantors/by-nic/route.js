import { connectDB } from "@/lib/db";

export async function GET(request) {
  const url = new URL(request.url);
  const nic = url.searchParams.get("nic");

  if (!nic) {
    return new Response(
      JSON.stringify({ success: false, error: "NIC is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let connection;
  try {
    connection = await connectDB();

    // Get guarantor data by NIC
    const [guarantorResults] = await connection.execute(
      `SELECT * FROM guarantor WHERE nic = ? ORDER BY id DESC LIMIT 1`,
      [nic]
    );

    if (guarantorResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Guarantor not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return the guarantor data
    return new Response(
      JSON.stringify({
        success: true,
        data: guarantorResults[0],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching guarantor by NIC:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error("Error closing DB connection:", e);
      }
    }
  }
}
