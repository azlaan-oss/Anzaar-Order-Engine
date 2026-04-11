
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listTabs() {
  console.log("🔍 Fetching Spreadsheet Tabs...");
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.NEXT_PUBLIC_ACTIVE_SHEET_ID;

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const tabs = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log("Available Tabs:", tabs);
  } catch (err) {
    console.error("❌ Error listing tabs:", err.message);
  }
}

listTabs();
