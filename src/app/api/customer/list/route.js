import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";


export async function GET(req) {
  let connection;
  try {
    connection = await connectDB();

    // Parse query params for filter and query
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const query = searchParams.get('query');

    console.log('[API] /api/customer/list filter:', filter, 'query:', query);

    let clients = [];
    if (filter && query) {
      // Check if partial matching is requested
      const partial = searchParams.get('partial') === 'true';
      
      let sql = 'SELECT id, fullname, nic, gender, location, district, address, telno FROM customer WHERE ';
      let params = [];
      
      // Handle special cases for partial matching
      let finalQuery = query;
      if (filter === 'nic' && partial) {
        // For NIC, allow partial matching but prioritize exact matches
        sql += `(
          nic = ?
          OR nic LIKE ?
          OR nic LIKE ?
          OR nic LIKE ?
        )`;
        params.push(query.toUpperCase());
        params.push(`${query.toUpperCase()}%`);
        params.push(`%${query.toUpperCase()}%`);
        params.push(`%${query.toUpperCase()}`);
      } else {
        switch (filter) {
          case 'name':
            sql += 'fullname LIKE ?';
            params.push(`%${query}%`);
            break;
          case 'nic':
            sql += 'nic = ?';
            params.push(query.toUpperCase());
            break;
          case 'id':
            sql += 'id = ?';
            params.push(query);
            break;
          case 'telno':
            sql += 'telno LIKE ?';
            params.push(`%${query}%`);
            break;
          case 'location':
            sql += 'location LIKE ?';
            params.push(`%${query}%`);
            break;
          default:
            return NextResponse.json({ error: 'Unknown filter' }, { status: 400 });
        }
      }
      console.log('[API] SQL:', sql, 'PARAMS:', params);
      [clients] = await connection.execute(sql, params);
    } else {
      // Don't return all clients by default
      return NextResponse.json([]);
    }

    // Get all loans with valid status (only approved, success, finished)
    const [loans] = await connection.execute(
      `SELECT customerid, status FROM loan WHERE status IN (1,2,3)`
    );

    // Calculate activeLoans for each client
    const loanMap = {};
    loans.forEach(l => {
      loanMap[l.customerid] = (loanMap[l.customerid] || 0) + 1;
    });

    const enrichedClients = clients.map(c => ({
      ...c,
      activeLoans: loanMap[c.id] || 0
    }));

    return NextResponse.json(enrichedClients);
  } catch (err) {
    console.error('[API] Error loading clients:', err);
    return NextResponse.json({ error: "Failed to load clients", error: err }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
