import { google } from 'googleapis';
import { Readable } from 'stream';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
});

const storage = google.storage({ version: 'v1', auth });
const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export async function uploadToStorage(buffer, path, mimeType = 'image/jpeg') {
  try {
    const res = await storage.objects.insert({
      bucket: BUCKET_NAME,
      name: path,
      media: {
        mimeType: mimeType,
        body: Readable.from(buffer),
      },
      predefinedAcl: 'publicRead', // Ensure public access for Google Sheets
    });

    // Construct the direct download link
    // Firebase Storage URLs usually look like: 
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media
    const encodedPath = encodeURIComponent(path);
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodedPath}?alt=media`;
  } catch (error) {
    console.error('Storage Upload Error:', error);
    throw error;
  }
}
