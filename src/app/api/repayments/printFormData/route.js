import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(request) {
  const db = await connectDB();
  const query = `
      SELECT 
        b.id AS loan_id,
        b.group_name,
        c.fullname AS customer_name,
        c.telno AS contact,
        c.gs, 
        b.loanTypeMode,
        b.loanType,          
        b.type,              
        ROUND(b.Totalpay, 2) AS Totalpay,
        b.term,
        ROUND(b.Totalpay / b.term, 2) AS installment,
        b.status,
        COUNT(r.id) AS paymentCount,
        ROUND(COALESCE(SUM(r.paid_amount), 0), 2) AS total_paid,
        ROUND(b.Totalpay - COALESCE(SUM(r.paid_amount), 0), 2) AS Outstanding_amount
      FROM 
        loan_bussiness b
      JOIN 
        customer c ON b.customerid = c.id
      LEFT JOIN 
        repayment r ON b.id = r.loan_bussiness_id
      WHERE 
        b.status = 'active'
      GROUP BY 
        b.id, b.group_name, c.fullname, c.telno, c.gs, b.loanTypeMode, 
        b.loanType, b.type, b.Totalpay, b.term, b.status
      ORDER BY 
        b.group_name;
    `;
  const [rows] = await db.query(query);
  return NextResponse.json(rows);
}