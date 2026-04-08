/**
 * Report Generation Logic for anzaar Intelligence Suite
 */

export const generateReportData = (orders) => {
  const stats = {
    regularOrders: 0,
    regularProducts: 0,
    customizeOrders: 0,
    customizeProducts: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalAdvance: 0,
    totalValue: 0,
    productCounts: {} // SKU -> Count
  };

  orders.forEach(order => {
    let isCustomOrder = false;
    let itemsInOrder = 0;

    // Financials
    stats.totalValue += (order.totals?.total || 0);
    stats.totalAdvance += (order.totals?.total - order.totals?.due) || 0;

    // Items Processing
    order.items?.forEach(item => {
      const qty = parseInt(item.quantity) || 1;
      itemsInOrder += qty;
      stats.totalProducts += qty;

      // Grouping product stats for the Bismillah List
      const productName = item.name || "Unknown Product";
      stats.productCounts[productName] = (stats.productCounts[productName] || 0) + qty;

      if (item.isCustomSize) isCustomOrder = true;
    });

    if (order.isUrgent) isCustomOrder = true;

    // Sorting Order Counts
    if (isCustomOrder) {
      stats.customizeOrders++;
      stats.customizeProducts += itemsInOrder;
    } else {
      stats.regularOrders++;
      stats.regularProducts += itemsInOrder;
    }

    stats.totalOrders++;
  });

  return stats;
};

export const formatReportToText = (stats, dateStr) => {
  const productList = Object.entries(stats.productCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([name, count], index) => `${index + 1}.\t${name}-${count}`)
    .join("\n");

  return `Bismillahir Rahmanir Rahim''
Anzaar Islamic Lifestyle

Online Order update: 
${dateStr}       

◽Regular Order: ${stats.regularOrders} pcs
 
◽Regular Product: ${stats.regularProducts} Pcs

◽Customize order: ${stats.customizeOrders}  pcs

◽Customize Product: ${stats.customizeProducts} pcs
 
◽Total Order:  ${stats.totalOrders}
◽Total Product: ${stats.totalProducts} pcs

◽Total Advance: ${stats.totalAdvance.toLocaleString()} TK
  
◽Total Order Value: ${stats.totalValue.toLocaleString()} TK
  

 ==================
${productList}

Alhamdulillah !`;
};
