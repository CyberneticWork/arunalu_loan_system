import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const {
      id,
      loan_name,
      loan_amount,
      loan_rate,
      service_charge,
      loan_frequency,
      loan_duration,
      total_amount,
    } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing sub-loan id" }), { status: 400 });
    }

    const db = await connectDB();
    const [result] = await db.execute(
      `UPDATE sub_loan_types
       SET loan_name = ?, loan_amount = ?, loan_rate = ?, service_charge = ?, loan_frequency = ?, loan_duration = ?, total_amount = ?
       WHERE id = ?`,
      [
        loan_name,
        loan_amount,
        loan_rate,
        service_charge,
        loan_frequency,
        loan_duration,
        total_amount,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: "No record updated" }), { status: 404 });
    }

    return new Response(JSON.stringify({ code: "SUCCESS" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}