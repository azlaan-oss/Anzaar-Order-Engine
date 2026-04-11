import { db } from "../../../../lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { uploadToProductFolder } from "../../../../lib/drive-manager";

export async function GET(req) {
  const results = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    results.total = querySnapshot.size;

    for (const productDoc of querySnapshot.docs) {
      const product = { ...productDoc.data(), id: productDoc.id };
      let needsUpdate = false;
      const updatedVariants = [...product.variants];

      for (let i = 0; i < updatedVariants.length; i++) {
        const variant = updatedVariants[i];

        // If it looks like base64 and not a URL
        const imageToMigrate = variant.image || variant.preview || variant.imageUrl;
        
        if (imageToMigrate && imageToMigrate.startsWith('data:image')) {
          try {
            const driveUrl = await uploadToProductFolder(imageToMigrate, product.name, variant.color);
            if (driveUrl) {
              updatedVariants[i] = {
                ...variant,
                image: driveUrl,
                imageUrl: driveUrl,
                preview: driveUrl, // Maintain compatibility
                migrated: true
              };
              needsUpdate = true;
              results.migrated++;
            }
          } catch (err) {
            console.error(`Migration failed for ${product.name} - ${variant.color}:`, err);
            results.failed++;
            results.details.push(`${product.name} (${variant.color}): ${err.message}`);
          }
        } else {
          results.skipped++;
        }
      }

      if (needsUpdate) {
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, {
          variants: updatedVariants,
          lastMigrated: new Date().toISOString()
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { status: 200 });
  } catch (error) {
    console.error("Migration Fatal Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
