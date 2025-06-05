import { connectDB } from "@/lib/db";

export async function GET() {
  let connection;
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      "SELECT id, name FROM loan_types"
    );
    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching loan types:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}

export async function POST(request) {
  let connection;
  try {
    const { name } = await request.json();
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    connection = await connectDB();
    const [result] = await connection.execute(
      "INSERT INTO loan_types (name) VALUES (?)",
      [name]
    );
    return Response.json({ id: result.insertId, name });
  } catch (error) {
    console.error("Error adding loan type:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}