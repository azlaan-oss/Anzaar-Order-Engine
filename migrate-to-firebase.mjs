import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { fetch } from 'undici';

// --- Environment Setup ---
// Native Node --env-file=.env.local is expected for secrets

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Cloud Storage Helper (Using Service Account) ---
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
});

const storageAPI = google.storage({ version: 'v1', auth });
const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

async function uploadToCloudStorage(buffer, productName, color) {
  const fileName = `${productName.replace(/\s+/g, '_')}_${color.replace(/\s+/g, '_')}.jpg`;
  const storagePath = `product-images/${productName}/${fileName}`;

  try {
    await storageAPI.objects.insert({
      bucket: BUCKET_NAME,
      name: storagePath,
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(buffer),
      },
      predefinedAcl: 'publicRead',
    });

    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodedPath}?alt=media`;
  } catch (err) {
    console.error(`      ❌ Storage API Error for ${fileName}:`, err.message);
    return null;
  }
}

async function migrate() {
  console.log("🚀 Starting Bulk Migration to Cloud Storage...");
  console.log(`📦 Targeted Bucket: ${BUCKET_NAME}`);
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    console.log(`📦 Found ${querySnapshot.size} products.`);

    let totalMigrated = 0;

    for (const productDoc of querySnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      let updated = false;
      const updatedVariants = [...(product.variants || [])];

      console.log(`🔍 Processing product: ${product.name}`);

      for (let i = 0; i < updatedVariants.length; i++) {
        const variant = updatedVariants[i];
        
        // Migrate if it's NOT already a GCS media link
        const isAlreadyMigrated = variant.imageUrl && variant.imageUrl.includes('alt=media');

        if (variant.imageUrl && !isAlreadyMigrated) {
          console.log(`   ⬆️ Migrating variant "${variant.color}"...`);
          
          let buffer;
          try {
            if (variant.imageUrl.startsWith('data:image')) {
              const base64Content = variant.imageUrl.split(',')[1];
              buffer = Buffer.from(base64Content, 'base64');
            } else {
              const response = await fetch(variant.imageUrl);
              if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
              const arrayBuffer = await response.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
            }

            const sizeKB = buffer.length / 1024;
            console.log(`      📊 Original Size: ${sizeKB.toFixed(2)} KB`);

            const newUrl = await uploadToCloudStorage(buffer, product.name, variant.color || 'Standard');
            if (newUrl) {
              updatedVariants[i].imageUrl = newUrl;
              updated = true;
              totalMigrated++;
              console.log(`      ✅ Successfully Migrated and Optimized.`);
            }
          } catch (e) {
            console.error(`      ❌ Failed to process variant:`, e.message);
          }
        }
      }

      if (updated) {
        await updateDoc(doc(db, 'products', productId), {
          variants: updatedVariants,
          updatedAt: new Date()
        });
        console.log(`   💾 Firestore Updated for "${product.name}".`);
      }
    }

    console.log(`\n🎉 Migration Successfully Finished!`);
    console.log(`✨ Total entries migrated: ${totalMigrated}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Critical Migration Failure:", err);
    process.exit(1);
  }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
