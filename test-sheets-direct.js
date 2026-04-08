const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testSync() {
  console.log("🔍 Starting Google Sheets Diagnostic...");
  
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.NEXT_PUBLIC_ACTIVE_SHEET_ID;

  if (!email || !key || !spreadsheetId) {
    console.error("❌ Missing Environment Variables!");
    console.log({ email: !!email, key: !!key, spreadsheetId: !!spreadsheetId });
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log(`📡 Connecting to Sheet: ${spreadsheetId}...`);

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['DIAGNOSTIC_TEST', new Date().toISOString()]]
      },
    });

    console.log("✅ SUCCESS! Entry added to Google Sheets.");
    console.log("Response Status:", res.status);
  } catch (err) {
    console.error("❌ FAILURE!");
    console.error("Error Message:", err.message);
    if (err.message.includes("404")) {
      console.log("💡 Tip: The Spreadsheet ID might be wrong or the Service Account doesn't have access.");
    } else if (err.message.includes("403")) {
      console.log("💡 Tip: Please share the spreadsheet with this email:", email);
    }
  }
}

testSync();
