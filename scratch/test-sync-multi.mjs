
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testMultiSync() {
  console.log("🚀 Simulating Multi-Item Order Sync...");

  const testOrder = {
    orderId: "TEST-SYNC-01",
    timestamp: new Date().toISOString(),
    customer: {
      name: "Research Specimen",
      phone: "01700000000",
      address: "Matrix Lab Core, Sector 7"
    },
    items: [
      { name: "Obsidian Shroud", color: "Deep Black", quantity: 1, price: 3500, image: null },
      { name: "Nebula Veil", color: "Celestial Blue", quantity: 1, price: 4200, image: null }
    ],
    delivery: { type: 'inside', charge: 80 },
    discount: { campaign: 'None', percentage: 0 },
    deliveryCharge: 80,
    sheetTab: 'Sheet1' // Testing with default tab
  };

  try {
    // Note: This assumes the local server is running or we hit the deployed endpoint.
    // For local testing without a running server, we could invoke the logic directly.
    // But since we want to test the ROUTE logic, we will assume localhost:3000 if available.
    
    // Fallback: Just log that we've prepared the diagnostic data.
    console.log("Order Payload prepared for verification.");
    console.log("Total Items:", testOrder.items.length);
    console.log("Target Sheet ID:", process.env.NEXT_PUBLIC_ACTIVE_SHEET_ID);
    
    // We will use the direct google-auth approach to verify the merging logic in a standalone script.
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testMultiSync();
