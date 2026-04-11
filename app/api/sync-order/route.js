import { google } from 'googleapis';

export async function POST(req) {
  try {
    const order = await req.json();

    // 1. Setup Auth with    // 1. Resolve Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const isTest = order.isTest || order.orderId === 'PING-TEST';

    // 2. Resolve internal Numeric Sheet ID (Required for Merging)
    // 2. Resolve internal Numeric Sheet ID (Required for Merging)
    const spreadsheetId = order.sheetId || process.env.NEXT_PUBLIC_ACTIVE_SHEET_ID;
    const requestedTab = (order.sheetTab || 'Sheet1').trim();
    
    let spreadsheetMaster;
    try {
      spreadsheetMaster = await sheets.spreadsheets.get({ spreadsheetId });
    } catch (err) {
      console.error("Spreadsheet Access Error:", err.message);
      return new Response(JSON.stringify({ 
        error: `Could not access master matrix ID: ${spreadsheetId.substring(0, 10)}... Ensure the Service Account has 'Editor' access.`,
        code: 'ACCESS_DENIED'
      }), { status: 403 });
    }

    // --- Intelligent Tab Discovery ---
    const availableTabs = spreadsheetMaster.data.sheets.map(s => s.properties.title);
    const currentDate = new Date();
    const currentMonthYear = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); // e.g. "April 2026"
    
    // Recovery Order: 
    // 1. Requested Tab (case-insensitive)
    // 2. Current Month Tab (e.g. "April 2026" or "april 2026")
    // 3. Fallback to 'Sheet1' if it exists
    // 4. Fallback to first available sheet
    
    let sheet = spreadsheetMaster.data.sheets.find(s => 
      s.properties.title.toLowerCase() === requestedTab.toLowerCase()
    );

    if (!sheet && requestedTab.toLowerCase() === 'sheet1') {
      // If default failed, try month-based discovery
      sheet = spreadsheetMaster.data.sheets.find(s => 
        s.properties.title.toLowerCase() === currentMonthYear.toLowerCase()
      );
    }

    if (!sheet) {
      console.warn(`Target tab "${requestedTab}" not found. Falling back to core discovery.`);
      // Check for any tab mentioning the current month
      sheet = spreadsheetMaster.data.sheets.find(s => 
        s.properties.title.toLowerCase().includes(currentDate.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase())
      );
    }

    if (!sheet) {
      return new Response(JSON.stringify({ 
        error: `Matrix tab not resolved. Requested: "${requestedTab}". Available: ${availableTabs.join(', ')}`,
        code: 'TAB_NOT_FOUND'
      }), { status: 404 });
    }

    const actualTabName = sheet.properties.title; 
    const numericSheetId = sheet.properties.sheetId;

    console.log(`📡 Deployment Synchronized: [${actualTabName}] ID: ${spreadsheetId}`);

    // --- Helper: Upload Base64 to ImgBB and return link ---
    // ... (Keep existing uploadToImgBB logic)
    const uploadToImgBB = async (imageData, fileName) => {
      if (!imageData) return 'No Image';
      if (typeof imageData === 'string' && imageData.startsWith('http')) return imageData;

      try {
        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) throw new Error("Missing ImgBB API Key");

        const base64Image = imageData.split(',')[1];
        const formData = new URLSearchParams();
        formData.append('image', base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        return data.success ? data.data.url : 'Upload Failed';
      } catch (err) {
        console.error("ImgBB Upload Error:", err);
        return 'Upload Failed';
      }
    };

    // Prepare Multi-Row Data
    const numItems = order.items.length;
    const isUrgent = order.isUrgent ? 'URGENT' : '';
    const productsSum = order.items.reduce((sum, item) => sum + item.price, 0);
    const dateStr = new Date(order.timestamp).toLocaleDateString('en-GB');

    // Process all images in parallel 
    const imageUrls = await Promise.all(
      order.items.map((item, idx) => 
        uploadToImgBB(item.image, `Order_${order.orderId}_${idx}.jpg`)
      )
    );

    // 4. Construct Rows
    const customerName = isTest ? `[DIAGNOSTIC PING] ${order.customer.name}` : order.customer.name;
    
    const rows = order.items.map((item, idx) => {
      if (idx === 0) {
        return [
          order.orderId,
          isTest ? 'TEST' : 'Pending',
          dateStr,
          `'${order.customer.phone}`,
          customerName,
          `${item.name} (${item.color}) x ${item.quantity}`,
          productsSum + (order.deliveryCharge || 0),
          order.customer.address,
          `=IMAGE("${imageUrls[idx]}")`,
          isUrgent
        ];
      }
      return [
        '', '', '', '', '',
        `${item.name} (${item.color}) x ${item.quantity}`,
        '', '',
        `=IMAGE("${imageUrls[idx]}")`,
        ''
      ];
    });

    // 5. Append To Sheets
    const range = `${actualTabName}!A:J`;
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });

    // 6. Merge Cells for multi-item orders
    if (numItems > 1) {
      const updatedRange = appendResponse.data.updates.updatedRange;
      const rowMatch = updatedRange.match(/A(\d+):J(\d+)/);
      if (rowMatch) {
        const startRow = parseInt(rowMatch[1]) - 1;
        const endRow = parseInt(rowMatch[2]);

        const mergeRequests = [0, 1, 2, 3, 4, 6, 7, 9].map(colIdx => ({
          mergeCells: {
            range: {
              sheetId: numericSheetId,
              startRowIndex: startRow,
              endRowIndex: endRow,
              startColumnIndex: colIdx,
              endColumnIndex: colIdx + 1,
            },
            mergeType: 'MERGE_ALL',
          },
        }));

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: mergeRequests },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Protocol synced to ${actualTabName}`,
      orderId: order.orderId
    }), { status: 200 });

  } catch (error) {
    console.error("Order Sync API Critical Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { status: 500 });
  }
}
