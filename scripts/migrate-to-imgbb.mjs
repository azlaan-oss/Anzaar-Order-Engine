import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { fetch } from 'undici';

// --- Environment Setup ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadToImgBB(imageData) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("CRITICAL: IMGBB_API_KEY is missing in .env.local");

  let base64Image;
  if (imageData.startsWith('data:image')) {
    base64Image = imageData.split(',')[1];
  } else {
    // Fetch external URL and convert to Base64
    const response = await fetch(imageData);
    const arrayBuffer = await response.arrayBuffer();
    base64Image = Buffer.from(arrayBuffer).toString('base64');
  }

  const formData = new URLSearchParams();
  formData.append('image', base64Image);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return data.success ? data.data.url : null;
}

async function migrate() {
  console.log("🚀 Starting Bulk Migration to ImgBB...");
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey || apiKey === "") {
    console.error("❌ ERROR: Please add your IMGBB_API_KEY to .env.local first!");
    process.exit(1);
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    console.log(`📦 Found ${querySnapshot.size} products.`);

    for (const productDoc of querySnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      let updated = false;
      const updatedVariants = [...(product.variants || [])];

      console.log(`🔍 Processing: ${product.name}`);

      for (let i = 0; i < updatedVariants.length; i++) {
        const variant = updatedVariants[i];
        if (variant.imageUrl && !variant.imageUrl.includes('imgbb.com')) {
          console.log(`   ⬆️ Migrating variant "${variant.color}"...`);
          const newUrl = await uploadToImgBB(variant.imageUrl);
          if (newUrl) {
            updatedVariants[i].imageUrl = newUrl;
            updated = true;
          }
        }
      }

      if (updated) {
        await updateDoc(doc(db, 'products', productId), {
          variants: updatedVariants,
          updatedAt: new Date()
        });
        console.log(`   ✅ Firestore Updated for "${product.name}".`);
      }
    }

    console.log(`\n🎉 Migration Successfully Finished!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failure:", err.message);
    process.exit(1);
  }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
