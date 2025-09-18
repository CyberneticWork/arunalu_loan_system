import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

// Reused helper to calculate due days excluding weekends & active holidays (mirrors repayments logic simplified)
async function calculateDueDaysWithConnection(row, connection) {
  const { last_payment: lastPayment, activate_date: activateDate, type } = row;
  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  let dueDateVal = "";
  const [holidays] = await connection.execute(
    "SELECT date FROM holidays WHERE status = 'active'"
  );
  const holidayDates = holidays.map(
    (h) => new Date(h.date).toISOString().split("T")[0]
  );
  const countBusiness = (startDate, incrementDays) => {
    let count = 0;
    let currentDate = new Date(startDate);
    while (currentDate < todayLocal) {
      currentDate.setDate(currentDate.getDate() + incrementDays);
      if (incrementDays === 1) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const currentStr = currentDate.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(currentStr);
        if (!isWeekend && !isHoliday) count++;
      } else if (incrementDays === 7) {
        // For weekly, treat each step as a potential week if the base date not holiday/weekend
        const potential = new Date(currentDate);
        potential.setDate(potential.getDate() - 7);
        const dayOfWeek = potential.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const potentialStr = potential.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(potentialStr);
        if (!isWeekend && !isHoliday) count++;
      }
    }
    return count;
  };
  if (lastPayment) {
    const base = new Date(lastPayment);
    const baseLocal = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate()
    );
    if (type?.toLowerCase() === "daily") {
      const businessDays = countBusiness(baseLocal, 1);
      dueDateVal = businessDays > 0 ? String(businessDays) : "";
    } else if (type?.toLowerCase() === "weekly") {
      const businessWeeks = countBusiness(baseLocal, 7);
      dueDateVal = businessWeeks > 0 ? String(businessWeeks) : "";
    } else {
      const months =
        (todayLocal.getFullYear() - baseLocal.getFullYear()) * 12 +
        (todayLocal.getMonth() - baseLocal.getMonth());
      dueDateVal = months > 0 ? String(months) : "";
    }
  } else if (activateDate) {
    const base = new Date(activateDate);
    const baseLocal = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate()
    );
    if (type?.toLowerCase() === "daily") {
      const businessDays = countBusiness(baseLocal, 1);
      dueDateVal = businessDays > 0 ? String(businessDays) : "";
    } else if (type?.toLowerCase() === "weekly") {
      const businessWeeks = countBusiness(baseLocal, 7);
      dueDateVal = businessWeeks > 0 ? String(businessWeeks) : "";
    } else {
      const months =
        (todayLocal.getFullYear() - baseLocal.getFullYear()) * 12 +
        (todayLocal.getMonth() - baseLocal.getMonth());
      dueDateVal = months > 0 ? String(months) : "";
    }
  }
  return dueDateVal;
}

// Helper: format MySQL date
function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 19).replace("T", " ");
}

// GET /api/fine-interest?action=list|overdue|stats
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";
  const nicFilter = (searchParams.get("nic") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 100);
  const offset = (page - 1) * limit;
  let connection;
  try {
    connection = await connectDB();
    if (action === "list") {
      const [[{ total }]] = await connection.execute(
        `SELECT COUNT(*) as total FROM loan_fines`
      );
      const [rows] = await connection.execute(
        `SELECT f.id, f.loan_id, f.customer_id, c.fullname, c.nic, f.reason, f.fine_amount, f.status, f.method,
                f.paid_at, f.created_at, f.due_reference_date
         FROM loan_fines f
         JOIN customer c ON c.id = f.customer_id
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return NextResponse.json({
        success: true,
        data: rows,
        page,
        limit,
        total,
      });
    }
    if (action === "overdue" || action === "due") {
      // Compute loans that have any dueDays > 0 and do not yet have an UNPAID fine created today for the same loan/customer
      const [loanRows] = await connection.execute(`
        SELECT 
          lb.id AS loan_id,
          lb.customerid AS customer_id,
          lb.type,
            lb.loanType,
          lb.activate_date,
          lb.last_payment,
          c.fullname,
          c.nic,
          c.telno,
          lb.Totalpay,
          (
            SELECT r.balance FROM repayment r WHERE r.loan_bussiness_id = lb.id ORDER BY r.id DESC LIMIT 1
          ) AS balance
        FROM loan_bussiness lb
        JOIN customer c ON c.id = lb.customerid
        WHERE lb.status = 'active'
      `);

      const enriched = [];
      for (const loan of loanRows) {
        if (
          nicFilter &&
          loan.nic &&
          loan.nic.toLowerCase() !== nicFilter.toLowerCase()
        )
          continue;
        const dueDays = await calculateDueDaysWithConnection(
          {
            last_payment: loan.last_payment,
            activate_date: loan.activate_date,
            type: loan.type,
          },
          connection
        );
        if (!dueDays) continue; // not due
        // Check if an unpaid fine already exists for this loan/customer (avoid duplicates)
        const [existingFine] = await connection.execute(
          `SELECT id FROM loan_fines WHERE customer_id=? AND (loan_id = ? OR loan_id IS NULL) AND status='unpaid' LIMIT 1`,
          [loan.customer_id, loan.loan_id]
        );
        if (existingFine.length > 0) continue;
        // Fetch last paid fine for this loan or customer (loan-specific preferred)
        const [lastPaid] = await connection.execute(
          `SELECT fine_amount, paid_at FROM loan_fines 
           WHERE customer_id=? AND status='paid' AND (loan_id = ? OR loan_id IS NULL)
           ORDER BY paid_at DESC LIMIT 1`,
          [loan.customer_id, loan.loan_id]
        );
        let lastFineAmount = null;
        let lastFineDate = null;
        if (lastPaid.length > 0) {
          lastFineAmount = Number(lastPaid[0].fine_amount);
          lastFineDate = lastPaid[0].paid_at;
        }
        const balNum = Number(loan.balance || 0);
        const arrears = balNum < 0 ? Math.abs(balNum) : 0;
        const overpayment = balNum > 0 ? balNum : 0;
        enriched.push({
          ...loan,
          dueDays: Number(dueDays),
          lastFineAmount,
          lastFineDate,
          arrears,
          overpayment,
        });
      }
      // Sort by highest dueDays first
      enriched.sort((a, b) => b.dueDays - a.dueDays);
      // Manual pagination after enrichment (since dueDays calculation done in JS)
      const total = enriched.length;
      const paged = enriched.slice(offset, offset + limit);
      return NextResponse.json({
        success: true,
        data: paged,
        page,
        limit,
        total,
      });
    }
    if (action === "stats") {
      const [[agg]] = await connection.execute(
        `SELECT 
            SUM(CASE WHEN status='unpaid' THEN fine_amount ELSE 0 END) AS total_unpaid,
            SUM(CASE WHEN status='paid' THEN fine_amount ELSE 0 END) AS total_paid,
            COUNT(*) AS total_fines
         FROM loan_fines`
      );
      return NextResponse.json({ success: true, data: agg });
    }
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/fine-interest - create fine | pay fine
// Body: { mode: 'create', customerId, loanId?, amount, reason, dueReferenceDate? }
//    or { mode: 'pay', fineId, method: 'cash'|'bank' }
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { mode } = body;
    if (!mode)
      return NextResponse.json(
        { success: false, message: "mode required" },
        { status: 400 }
      );
    connection = await connectDB();

    if (mode === "create") {
      const {
        customerId,
        loanId = null,
        amount,
        reason = null,
        dueReferenceDate = null,
      } = body;
      if (!customerId || !amount) {
        return NextResponse.json(
          { success: false, message: "customerId and amount required" },
          { status: 400 }
        );
      }
      await connection.execute(
        `INSERT INTO loan_fines (loan_id, customer_id, reason, fine_amount, due_reference_date) VALUES (?,?,?,?,?)`,
        [loanId, customerId, reason, amount, dueReferenceDate]
      );
      return NextResponse.json({ success: true, message: "Fine created" });
    }

    if (mode === "pay") {
      const { fineId, method } = body;
      if (!fineId || !method) {
        return NextResponse.json(
          { success: false, message: "fineId and method required" },
          { status: 400 }
        );
      }
      // Get fine
      const [rows] = await connection.execute(
        `SELECT * FROM loan_fines WHERE id = ?`,
        [fineId]
      );
      if (rows.length === 0)
        return NextResponse.json(
          { success: false, message: "Fine not found" },
          { status: 404 }
        );
      const fine = rows[0];
      if (fine.status !== "unpaid")
        return NextResponse.json(
          { success: false, message: "Fine already processed" },
          { status: 400 }
        );

      await connection.beginTransaction();
      try {
        await connection.execute(
          `UPDATE loan_fines SET status='paid', method=?, paid_at = NOW() WHERE id = ?`,
          [method, fineId]
        );
        // Ensure numeric formatting (MySQL DECIMAL may be returned as string)
        const fineAmountNum = Number(fine.fine_amount);
        const fineAmountFormatted = isNaN(fineAmountNum)
          ? "0.00"
          : fineAmountNum.toFixed(2);
        await connection.execute(
          `INSERT INTO cashbook (description, type, amount, category, method, created_at) VALUES (?,?,?,?,?, CURRENT_TIMESTAMP())`,
          [
            `Fine Payment - Customer ${fine.customer_id}`,
            "income",
            fineAmountFormatted,
            "Fine Payment",
            method,
          ]
        );
        await connection.commit();
        return NextResponse.json({ success: true, message: "Fine paid" });
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    }

    if (mode === "approveDue") {
      const { loanId, customerId, amount, reason } = body;
      if (!loanId || !customerId || !amount) {
        return NextResponse.json(
          { success: false, message: "loanId, customerId & amount required" },
          { status: 400 }
        );
      }
      // Avoid duplicate unpaid fine
      const [exists] = await connection.execute(
        `SELECT id FROM loan_fines WHERE loan_id=? AND customer_id=? AND status='unpaid' LIMIT 1`,
        [loanId, customerId]
      );
      if (exists.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Unpaid fine already exists for this loan",
          },
          { status: 400 }
        );
      }
      await connection.execute(
        `INSERT INTO loan_fines (loan_id, customer_id, reason, fine_amount) VALUES (?,?,?,?)`,
        [loanId, customerId, reason || "Due Fine", amount]
      );
      return NextResponse.json({ success: true, message: "Due fine approved" });
    }

    return NextResponse.json(
      { success: false, message: "Invalid mode" },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
