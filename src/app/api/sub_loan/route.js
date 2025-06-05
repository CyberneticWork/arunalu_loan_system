import { connectDB } from "@/lib/db";

export async function POST(request) {
  let connection;
  try {
    const { sub_loan_name, mainLoanId } = await request.json();
    if (!sub_loan_name || !mainLoanId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    connection = await connectDB();
    const [result] = await connection.execute(
      "INSERT INTO sub_loan_types (sub_loan_name, mainLoanId) VALUES (?, ?)",
      [sub_loan_name, mainLoanId]
    );
    return Response.json({ id: result.insertId, sub_loan_name, mainLoanId });
  } catch (error) {
    console.error("Error adding sub loan type:", error);
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mainLoanId = searchParams.get("mainLoanId");
  if (!mainLoanId) {
    return Response.json({ error: "mainLoanId required" }, { status: 400 });
  }
  let connection;
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      "SELECT id, sub_loan_name FROM sub_loan_types WHERE mainLoanId = ?",
      [mainLoanId]
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
  }
}