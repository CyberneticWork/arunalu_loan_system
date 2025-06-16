import { connectDB } from "@/lib/db";

export async function GET(req, context) {
  const { params } = context;
  const { loancategoryid } = params;
  if (!loancategoryid) {
    return new Response(JSON.stringify({ error: "Missing category name" }), { status: 400 });
  }

  try {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT loan_name, loan_amount, loan_rate, service_charge, loan_frequency, loan_duration, total_amount FROM sub_loan_types WHERE id = ? LIMIT 1",
      [loancategoryid]
    );
    if (rows.length === 0) {
      return new Response(JSON.stringify({ loanData: null }), { status: 200 });
    }
    return new Response(JSON.stringify({ loanData: rows[0] }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
}