import { connectDB } from "@/lib/db";

// Helper to replace undefined with null
function safeParam(val) {
  return val === undefined ? null : val;
}

export async function POST(req) {
  let connection;
  try {
    const data = await req.json();
    const { loanData, client, CROid, guarantors } = data;

    connection = await connectDB();
    await connection.beginTransaction();

    // 1. Insert loan_bussiness
    const loanParams = [
      client.id,
      parseInt(loanData.selectedManager, 10),
      CROid,
      null,
      client.location,
      client.gs,
      client.ds,
      client.province,
      loanData.loanTypeMode,
      loanData.loanTypeMode === "group" ? loanData.groupName : null,
      loanData.loanType,
      loanData.loanName,
      loanData.selectedSubLoanCategory,
      loanData.serviceCharge,
      loanData.loanFrequency,
      loanData.loanAmount,
      loanData.interestRate,
      loanData.loanDuration,
      loanData.initialPay,
      loanData.initialPayType,
      loanData.IssueAmmount,
      loanData.Installment,
      loanData.totalAmount,
      loanData.loanDuration,
      loanData.residenttype,
      loanData.billtype,
      "pending",
      loanData.submittedAt
        ? new Date(loanData.submittedAt).toISOString().slice(0, 19).replace("T", " ")
        : null,
    ].map(safeParam);

    const [loanResult] = await connection.execute(
      `INSERT INTO loan_bussiness 
        (customerid, CROid, Addby, contractid, location, gs, ds, province, loanTypeMode, group_name, loanType, loanName, loanCategoryId, serviceCharge, type, loanAmount, rate, term, initialPay, initialPayType, IssueAmmount, Installment, Totalpay, ratetearm, residenttype, billtype, status, addat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      loanParams
    );

    const loanId = loanResult.insertId;

    // 2. Insert each guarantor (type = "sdf")
    for (const g of guarantors) {
      const guarantorParams = [
        client.id,
        loanId,
        g.name,
        g.nic,
        g.gender,
        g.dob,
        g.relation,
        g.address,
        g.province,
        g.gs,
        g.ds,
        g.district,
        g.phone,
        g.monthlyIncome,
        "sdf",
        g.accountno,
        g.bankname,
      ].map(safeParam);

      await connection.execute(
        `INSERT INTO guarantor 
          (customerid, loandid, name, nic, gender, dob, relation, address, province, gs, ds, district, number, income, type, accountno, bankname)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        guarantorParams
      );
    }

    await connection.commit();
    return Response.json({ code: "SUCCESS", loanId });
  } catch (error) {
    if (connection) await connection.rollback();
    return Response.json(
      { code: "ERROR", message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection)
      try {
        await connection.end();
      } catch {}
  }
}
