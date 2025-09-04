import { connectDB } from "@/lib/db";

// Helper function to calculate due days excluding holidays
async function calculateDueDays(lastPayment, activateDate, type, connection) {
  const today = new Date();
  // Set to local date without time component
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  let dueDateVal = "";

  // Get all active holidays
  const [holidays] = await connection.execute(
    "SELECT date FROM holidays WHERE status = 'active'"
  );

  // Convert holiday dates to local date strings (YYYY-MM-DD format)
  const holidayDates = holidays.map((holiday) => {
    const date = new Date(holiday.date);
    // Convert to local date string in YYYY-MM-DD format
    return date.toISOString().split("T")[0];
  });

  // console.log("Active holidays (local dates):", holidayDates);

  // Helper function to convert date to local YYYY-MM-DD format
  const toLocalDateString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  if (lastPayment) {
    const lastPaymentDate = new Date(lastPayment);
    const lastPaymentLocal = new Date(
      lastPaymentDate.getFullYear(),
      lastPaymentDate.getMonth(),
      lastPaymentDate.getDate()
    );

    if (type && type.toLowerCase() === "daily") {
      let businessDays = 0;
      let currentDate = new Date(lastPaymentLocal);

      // Count only non-holiday weekdays
      while (currentDate < todayLocal) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        // Check if current date is a holiday using YYYY-MM-DD format
        const currentDateStr = currentDate.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(currentDateStr);

        if (!isWeekend && !isHoliday) {
          businessDays++;
        }
      }
      dueDateVal = businessDays > 0 ? businessDays.toString() : "";
    } else if (type && type.toLowerCase() === "weekly") {
      let businessWeeks = 0;
      let currentDate = new Date(lastPaymentLocal);

      // Count weeks excluding holidays
      while (currentDate < todayLocal) {
        currentDate.setDate(currentDate.getDate() + 7); // Add one week
        const paymentDueDate = new Date(currentDate);
        paymentDueDate.setDate(paymentDueDate.getDate() - 7); // Check the payment due date

        // Check if the due date falls on a holiday
        const dayOfWeek = paymentDueDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const dueDateStr = paymentDueDate.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(dueDateStr);

        if (!isWeekend && !isHoliday) {
          businessWeeks++;
        }
      }
      dueDateVal = businessWeeks > 0 ? businessWeeks.toString() : "";
    } else {
      // Monthly
      const months =
        (todayLocal.getFullYear() - lastPaymentLocal.getFullYear()) * 12 +
        (todayLocal.getMonth() - lastPaymentLocal.getMonth());
      dueDateVal = months > 0 ? months.toString() : "";
    }
  } else if (activateDate) {
    const activate = new Date(activateDate);
    const activateLocal = new Date(
      activate.getFullYear(),
      activate.getMonth(),
      activate.getDate()
    );

    if (type && type.toLowerCase() === "daily") {
      let businessDays = 0;
      let currentDate = new Date(activateLocal);

      // Count only non-holiday weekdays from activation
      while (currentDate < todayLocal) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const currentDateStr = currentDate.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(currentDateStr);

        if (!isWeekend && !isHoliday) {
          businessDays++;
        }
      }
      dueDateVal = businessDays > 0 ? businessDays.toString() : "";
    } else if (type && type.toLowerCase() === "weekly") {
      let businessWeeks = 0;
      let currentDate = new Date(activateLocal);

      // Count weeks from activation excluding holidays
      while (currentDate < todayLocal) {
        currentDate.setDate(currentDate.getDate() + 7);
        const paymentDueDate = new Date(currentDate);
        paymentDueDate.setDate(paymentDueDate.getDate() - 7);

        const dayOfWeek = paymentDueDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const dueDateStr = paymentDueDate.toISOString().split("T")[0];
        const isHoliday = holidayDates.includes(dueDateStr);

        if (!isWeekend && !isHoliday) {
          businessWeeks++;
        }
      }
      dueDateVal = businessWeeks > 0 ? businessWeeks.toString() : "";
    } else {
      // Monthly
      const months =
        (todayLocal.getFullYear() - activateLocal.getFullYear()) * 12 +
        (todayLocal.getMonth() - activateLocal.getMonth());
      dueDateVal = months > 0 ? months.toString() : "";
    }
  }

  return dueDateVal;
}

export async function GET() {
  let connection;
  try {
    connection = await connectDB();

    const [rows] = await connection.execute(`
      SELECT 
        lb.id,
        lb.customerid,
        c.telno,
        lb.loanTypeMode,
        lb.loanType,
        lb.type,
        lb.Totalpay,
        lb.status,
        lb.group_name, 
        lb.rate,
        c.fullname as customerName,
        c.gs,
        c.ds,
        c.location,
        lb.term,
        lb.activate_date,
        lb.last_payment,
        (
          SELECT COUNT(*) FROM repayment r WHERE r.loan_bussiness_id = lb.id
        ) as paymentCount,
        CASE
          WHEN lb.type = 'daily' THEN CONCAT(lb.loanType, ' (Daily)')
          WHEN lb.type = 'weekly' THEN CONCAT(lb.loanType, ' (Weekly)')
          WHEN lb.type = 'monthly' THEN CONCAT(lb.loanType, ' (Monthly)')
          ELSE lb.loanType
        END as formattedLoanType,
        COALESCE(
          (SELECT lb.Totalpay - SUM(r.paid_amount)
           FROM repayment r 
           WHERE r.loan_bussiness_id = lb.id),
          lb.Totalpay
        ) as remainingAmount,
        COALESCE((
          SELECT r.balance
          FROM repayment r
          WHERE r.loan_bussiness_id = lb.id
          ORDER BY r.id DESC
          LIMIT 1
        ), 0) as balance
      FROM loan_bussiness lb
      JOIN customer c ON lb.customerid = c.id
      WHERE lb.status = 'active'
      ORDER BY lb.addat DESC
    `);

    // Calculate due days for each row with holiday consideration
    const dataWithDueDays = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        loanType: row.formattedLoanType,
        remainingAmount: Number(row.remainingAmount || row.Totalpay),
        arrears: Number(row.balance) < 0 ? Math.abs(Number(row.balance)) : 0,
        overpayment: Number(row.balance) > 0 ? Number(row.balance) : 0,
        dueDays: await calculateDueDays(
          row.last_payment,
          row.activate_date,
          row.type,
          connection
        ),
      }))
    );

    return Response.json({
      code: "SUCCESS",
      data: dataWithDueDays,
    });
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return Response.json(
      {
        code: "ERROR",
        message: "Failed to fetch repayments",
      },
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
