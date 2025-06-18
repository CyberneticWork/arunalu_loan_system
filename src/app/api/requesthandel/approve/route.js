import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";

export async function POST(request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { code: 'ERROR', message: 'ID is required' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Start transaction
    await db.beginTransaction();

    try {
      // 1. Get the update_customer record
      const [updateCustomer] = await db.execute(
        'SELECT * FROM update_customer WHERE id = ?',
        [id]
      );

      if (!updateCustomer[0]) {
        throw new Error('Request not found');
      }

      // 2. Update customer table with new data
      await db.execute(
        'UPDATE customer SET ' +
        'fullname = ?, prefix = ?, nic = ?, gender = ?, dob = ?, ' +
        'location = ?, telno = ?, address = ?, gs = ?, ds = ?, ' +
        'district = ?, province = ?, editby = ?, editat = CURRENT_TIMESTAMP ' +
        'WHERE nic = ?',
        [
          updateCustomer[0].fullname,
          updateCustomer[0].prefix,
          updateCustomer[0].nic,
          updateCustomer[0].gender,
          updateCustomer[0].dob,
          updateCustomer[0].location,
          updateCustomer[0].telno,
          updateCustomer[0].address,
          updateCustomer[0].gs,
          updateCustomer[0].ds,
          updateCustomer[0].district,
          updateCustomer[0].province,
          'admin',
          updateCustomer[0].nic
        ]
      );

      // 3. Get the update_spouse record (by customers or by NIC)
      let [updateSpouse] = await db.execute(
        'SELECT * FROM update_spouse WHERE customers = ?',
        [id]
      );
      if (!updateSpouse[0]) {
        // fallback: find by NIC
        [updateSpouse] = await db.execute(
          'SELECT * FROM update_spouse WHERE nic = ?',
          [updateCustomer[0].nic]
        );
      }

      if (updateSpouse[0]) {
        // Find the actual customer id for spouse table update
        const [customerRow] = await db.execute(
          'SELECT id FROM customer WHERE nic = ?',
          [updateCustomer[0].nic]
        );
        const customerId = customerRow[0]?.id;
        if (customerId) {
          // 4. Update spouse table with new data (by customers = customerId)
          await db.execute(
            'UPDATE spouse SET ' +
            'nic = ?, name = ?, address = ?, telno = ?, relation = ?, ' +
            'editby = ?, editat = CURRENT_TIMESTAMP ' +
            'WHERE customers = ?',
            [
              updateSpouse[0].nic,
              updateSpouse[0].name,
              updateSpouse[0].address,
              updateSpouse[0].telno,
              updateSpouse[0].relation,
              'admin',
              customerId
            ]
          );
        }
      }

      // 5. Update update_customer status to Approved
      await db.execute(
        'UPDATE update_customer SET status = ?, editby = ?, editat = CURRENT_TIMESTAMP WHERE id = ?',
        ['Approved', 'admin', id]
      );

      // Commit transaction
      await db.commit();

      return NextResponse.json({
        code: 'SUCCESS',
        message: 'Request approved successfully'
      });

    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    } finally {
      await db.end();
    }

  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to approve request' },
      { status: 500 }
    );
  }
}