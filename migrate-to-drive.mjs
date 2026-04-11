import { google } from 'googleapis';
import { Readable } from 'stream';
import { fetch } from 'undici';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Environment variables are expected to be provided by the runner (e.g., node --env-file)

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Google Drive Setup ---
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function getOrCreateFolder(name, parentId = null) {
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
}

async function uploadToProductFolder(imageInput, productName, fileName) {
  if (!imageInput) return null;

  let buffer;
  let mimeType = 'image/jpeg';

  if (imageInput.startsWith('data:image')) {
    const base64Content = imageInput.split(',')[1];
    buffer = Buffer.from(base64Content, 'base64');
    const detectedMime = imageInput.split(';')[0].split(':')[1];
    if (detectedMime) mimeType = detectedMime;
  } else if (imageInput.startsWith('http')) {
    const response = await fetch(imageInput);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = response.headers.get('content-type') || 'image/jpeg';
  } else {
    return null;
  }

  // Hardcoded Root Folder ID shared by the user (Owned by project.azlaan@gmail.com)
  const rootId = "1ivWTVPbJlG7yZdD0XHbT5JxLECmBPl1w";
  
  // 1. Setup Folders with Ownership Transfer
  const productsRootId = await getOrCreateFolder('Products', rootId);
  const productFolderId = await getOrCreateFolder(productName, productsRootId);

  // Transfer folder ownership if not done yet
  try {
    await drive.permissions.create({
      fileId: productFolderId,
      transferOwnership: true,
      requestBody: { role: 'owner', type: 'user', emailAddress: 'project.azlaan@gmail.com' },
    });
  } catch (e) { /* Might already be owner or restricted, ignore */ }

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

  // 3. Transfer File Ownership to User (This fixes the quota issue)
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
    console.warn(`   ⚠️ Warning: Could not transfer ownership of ${fileName}, making public instead.`);
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  }

  return `https://docs.google.com/uc?export=view&id=${fileId}`;
}

// --- Main Migration Logic ---
async function migrate() {
  console.log("🚀 Starting Migration to Google Drive...");
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    console.log(`📦 Found ${querySnapshot.size} products.`);

    for (const productDoc of querySnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      let updated = false;
      const updatedVariants = [...(product.variants || [])];

      console.log(`🔍 Checking product: ${product.name}`);

      for (let i = 0; i < updatedVariants.length; i++) {
        const variant = updatedVariants[i];
        if (variant.imageUrl && !variant.imageUrl.includes('docs.google.com')) {
          console.log(`   ⬆️ Uploading variant "${variant.color}" to Drive...`);
          try {
            const driveUrl = await uploadToProductFolder(variant.imageUrl, product.name, variant.color || 'Standard');
            if (driveUrl) {
              updatedVariants[i].imageUrl = driveUrl;
              updated = true;
              console.log(`   ✅ Success: ${driveUrl}`);
            }
          } catch (err) {
            console.error(`   ❌ Failed to upload variant "${variant.color}":`, err.message);
          }
        }
      }

      if (updated) {
        await updateDoc(doc(db, 'products', productId), {
          variants: updatedVariants,
          updatedAt: new Date()
        });
        console.log(`✅ Updated product "${product.name}" in Firestore.`);
      }
    }

    console.log("🎉 Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

migrate();
