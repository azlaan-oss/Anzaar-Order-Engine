import { google } from 'googleapis';

export async function POST(req) {
  try {
    const order = await req.json();

    // 1. Setup Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 2. Identify the target sheet ID
    const spreadsheetId = order.sheetId || process.env.NEXT_PUBLIC_ACTIVE_SHEET_ID;
    const sheetTab = order.sheetTab || 'Sheet1';

    // 3. Prepare row data to match exactly 18 columns
    // Columns: Date, Order Number, Urgent, Note, Name, Phone Number, Address, Product Info, Size, Product Photo, Price, Delivery Charge, Total, Advance, Bkash, Due, DM, Shipment Status
    const isUrgent = order.isUrgent ? 'URGENT' : '';
    
    // Total original price without delivery
    const productsSum = order.items.reduce((sum, item) => sum + item.price, 0);

    const values = [
      [
        new Date(order.timestamp).toLocaleDateString('en-GB'), // Date (DD/MM/YYYY)
        order.orderId,                                  // Order Number
        isUrgent,                                       // Urgent
        order.customer.notes || '',                     // Note
        order.customer.name,                            // Name
        `'${order.customer.phone}`,                     // Phone Number (Lead with ' to keep as string)
        order.customer.address,                         // Address
        order.items.map(i => `${i.name} (${i.color})`).join(', '), // Product Info
        order.items.map(i => i.size).join(', '),        // Size
        order.payment.proofUrl ? "Photo Uploaded" : "No Photo", // Product Photo Status
        productsSum,                                    // Price
        order.totals.delivery,                          // Delivery Charge
        order.totals.total,                             // Total
        order.payment.advancePaid ? order.payment.amount : 0, // Advance
        order.payment.transactionId || '',              // Transaction ID
        order.totals.due,                               // Due
        order.payment.senderPhone || '',                // Sender Phone
        order.status || 'Pending Review',               // Protocol Status
        order.isUrgent ? 'URGENT Fulfillment' : 'Regular' // Priority Detail
      ]
    ];

    // 4. Append to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTab}!A:T`, // Expanded to 20 columns
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return new Response(JSON.stringify({ success: true, data: response.data }), { status: 200 });

  } catch (error) {
    console.error('Google Sheets Sync Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
