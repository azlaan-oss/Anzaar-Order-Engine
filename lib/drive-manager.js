import { google } from 'googleapis';
import { Readable } from 'stream';
import { fetch } from 'undici';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Finds or creates a folder in Google Drive
 */
export async function getOrCreateFolder(name, parentId = null) {
  try {
    let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Not found, create it
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error('Drive Folder Error:', error);
    throw error;
  }
}

/**
 * Uploads an image (base64 or URL) to a specific product folder in Drive
 */
export async function uploadToProductFolder(imageInput, productName, fileName) {
  if (!imageInput) return null;

  try {
    let buffer;
    let mimeType = 'image/jpeg';

    if (imageInput.startsWith('data:image')) {
      // Handle Base64
      const base64Content = imageInput.split(',')[1];
      buffer = Buffer.from(base64Content, 'base64');
      const detectedMime = imageInput.split(';')[0].split(':')[1];
      if (detectedMime) mimeType = detectedMime;
    } else if (imageInput.startsWith('http')) {
      // Handle URL
      const response = await fetch(imageInput);
      if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else {
      console.error('Invalid image input format');
      return null;
    }

    // 1. Setup Folder Structure
    const rootId = await getOrCreateFolder('Anzaar_Vault_Assets');
    const productsRootId = await getOrCreateFolder('Products', rootId);
    const productFolderId = await getOrCreateFolder(productName, productsRootId);

    // 2. Upload File
    const driveRes = await drive.files.create({
      requestBody: {
        name: `${fileName}.jpg`,
        mimeType: mimeType,
        parents: [productFolderId],
      },
      media: {
        mimeType: mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id',
    });

    const fileId = driveRes.data.id;

    // 3. Transfer Ownership to User (Fixes quota issues for personal accounts)
    try {
      await drive.permissions.create({
        fileId: fileId,
        transferOwnership: true,
        requestBody: {
          role: 'owner',
          type: 'user',
          emailAddress: 'project.azlaan@gmail.com',
        },
      });
    } catch (err) {
      console.warn('Ownership transfer failed, falling back to public reader:', err.message);
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    // 4. Construct hotlink
    return `https://docs.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Drive Upload Error:', error);
    throw error;
  }
}

