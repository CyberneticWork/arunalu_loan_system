import { connectDB } from "@/lib/db";

export async function GET(request) {
  // Extract NIC from URL query parameters
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

    // Check if the NIC exists in guarantor table
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM guarantor WHERE nic = ?",
      [nic]
    );

    const exists = result[0].count > 0;

    return new Response(JSON.stringify({ success: true, exists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking NIC:", error);
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
