import { connectDB } from "@/lib/db";

export async function GET(req) {
  let connection;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ 
        code: "ERROR", 
        message: "Employee ID is required" 
      }, { status: 400 });
    }

    connection = await connectDB();
    const [rows] = await connection.execute(
      "SELECT id, name, empid, email, roll FROM employees WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return Response.json({ 
        code: "ERROR", 
        message: "Employee not found" 
      }, { status: 404 });
    }

    return Response.json({
      code: "SUCCESS",
      employee: rows[0]
    });

  } catch (error) {
    console.error("Error fetching employee:", error);
    return Response.json({ 
      code: "ERROR", 
      message: error.message 
    }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}