// import { Products } from '@sap/cds/common';
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Products, Sales, SupplierOrders, Alerts, Suppliers, StockMovements, Reports, Users } = this.entities;
  // Implement getLowStockProducts action
  this.on('getLowStockProducts', async () => {
    debugger
    const lowStockProducts = await SELECT.from(Products).where({
      stockLevel: { '<': { reorderThreshold: 1 } }
    });
    console.log(lowStockProducts);
    return lowStockProducts;

  });

  this.before('UPDATE', 'Products', async (req) => {
    debugger
    var Stock = req.Stock;
  })





  this.after('READ', 'Sales', async (sales) => {
  debugger
    if (!Array.isArray(sales)) sales = [sales]; // Ensure handling both single and multiple records

    sales.forEach((sale) => {
      if (sale.quantity && sale.unitPrice) {
        sale.totalPrice = (sale.quantity * sale.unitPrice).toFixed(2);
      }
    });
  })


  this.before('CREATE', 'Sales', async (req) => {
    debugger
    const { quantity, unitPrice } = req.data;

    // ✅ Ensure quantity and unit price exist
    if (!quantity || !unitPrice) {
        req.error(400, "Quantity and Unit Price are required.");
        return;
    }

    // ✅ Calculate totalPrice before saving
    req.data.totalPrice = (quantity * unitPrice).toFixed(2);
});



  this.on('addProduct', async (req) => {
    debugger;
    console.log(req.data);
    
    const { name, description, category, price, stockLevel, reorderThreshold, supplier } = req.data;

    // ✅ Ensure the supplier exists
    const existingSupplier = await SELECT.one.from('Suppliers').where({ ID: supplier });
    if (!existingSupplier) {
        req.error(400, `Supplier with ID ${supplier} not found`);
        return;
    }

    // ✅ Insert new product with correct supplier reference
    const [newProduct] = await INSERT.into('Products').entries({
        name,
        description,
        category,
        price,
        stockLevel,
        reorderThreshold,
        supplier: { ID: supplier }  // ✅ Ensure proper association reference
    });

    return newProduct;
});





  this.on('editProduct', async (req) => {
    debugger
    const id = req.data.productsId;
    // console.log(id);
    const product = await SELECT.one.from(Products).where({ ID: id });
    console.log("Product fetched:", product);
    const supplier = await SELECT.one.from(Suppliers).where({ ID: product.supplier_ID });
    console.log(supplier);

    return { ...product, supplier };
  })



  this.on('updateProduct', async (req) => {
    debugger;

    const { ID, name, description, category, price, stockLevel, reorderThreshold, supplier } = req.data;

    if (!ID) {
      req.error(400, "Product ID is required for updating.");
      return;
    }

    // ✅ Update product in the database
    const updatedProduct = await cds.update(Products)
      .set({
        name,
        description,
        category,
        price,
        stockLevel,
        reorderThreshold,
        supplier: { ID: supplier }
      })
      .where({ ID });

    if (updatedProduct === 0) {
      req.error(404, `Product with ID ${ID} not found.`);
    } else {
      return { message: `Product ${ID} updated successfully` };
    }
  });




  this.on('deleteProduct', async (req) => {
    debugger
    const id = req.data.productsId;
    console.log(id);
    await cds.delete(Products).where({ id });
  });


  this.on('generateReport', async (req) => {
    debugger;

    // 🗑 **Step 1: Delete all existing reports before inserting new ones**
    await DELETE.from(Reports);
    console.log("All existing reports deleted.");

    const reportsToInsert = [];

    for (let i = 0; i < 5; i++) {  // Generate 5 reports with different dates
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - i);  // Different dates for each report

      // 🛒 **Sales Insights**
      const totalSalesResult = await SELECT.one`SUM(quantity * unitPrice) as totalSalesAmount`.from(Sales);
      const totalOrdersResult = await SELECT.one`COUNT(ID) as totalOrders`.from(Sales);

      // Add slight variations to the sales data so each report is unique
      const randomMultiplier = 0.9 + Math.random() * 0.2; // Random value between 0.9 and 1.1
      const totalSalesAmount = Math.round((totalSalesResult?.totalSalesAmount || 0) * randomMultiplier);
      const totalOrders = Math.round((totalOrdersResult?.totalOrders || 0) * randomMultiplier);

      const bestSellingProductResult = await SELECT.one`product_ID, SUM(quantity) as totalQuantity`
        .from(Sales)
        .groupBy('product_ID')
        .orderBy({ totalQuantity: 'desc' })
        .limit(1);

      // 📦 **Inventory Insights**
      const lowStockProductsResult = await SELECT.one`COUNT(*) as count`
        .from(Products)
        .where`stockLevel < reorderThreshold`;

      const highestStockProductResult = await SELECT.one`ID`
        .from(Products)
        .orderBy({ stockLevel: 'desc' })
        .limit(1);

      // 🏆 **Supplier Performance**
      const supplierPerformanceResult = await SELECT.one`AVG(rating) as avgRating`.from(Suppliers);
      const topSupplierResult = await SELECT.one`ID`
        .from(Suppliers)
        .orderBy({ rating: 'desc' })
        .limit(1);

      // 👥 **Customer Insights**
      const newCustomersResult = await SELECT.one`COUNT(DISTINCT customerEmail) as count`
        .from(Sales)
        .where`saleDate >= ADD_DAYS(CURRENT_DATE, -30)`;

      const repeatCustomersResult = await SELECT.one`COUNT(*) as count`
        .from(
          SELECT`customerEmail`
            .from(Sales)
            .groupBy`customerEmail`
            .having`COUNT(ID) > 1`
        );

      // 📝 **Prepare Report Data**
      const reportData = {
        ID: cds.utils.uuid(),
        reportDate: reportDate.toISOString().split('T')[0], // Store only date
        totalSalesAmount,
        totalOrders,
        bestSellingProduct_ID: bestSellingProductResult?.product_ID || null,
        lowStockProducts: lowStockProductsResult?.count || 0,
        highestStockProduct_ID: highestStockProductResult?.ID || null,
        supplierPerformance: Math.round(supplierPerformanceResult?.avgRating) || 0,
        topSupplier_ID: topSupplierResult?.ID || null,
        newCustomers: newCustomersResult?.count || 0,
        repeatCustomers: repeatCustomersResult?.count || 0,
        createdAt: new Date()
      };

      reportsToInsert.push(reportData);
    }

    // ✅ **Step 2: Insert New 5 Reports**
    console.log("Inserting new reports:", reportsToInsert);
    await INSERT.into(Reports).entries(reportsToInsert);

    return reportsToInsert;
  });





  this.on('addSales', async (req) => {
    debugger;
    console.log(req.data);

    const { product, quantity, unitPrice, saleDate, customer, paymentMethod, status } = req.data;

    // ✅ Ensure the product exists
    const existingProduct = await SELECT.one.from('Products').where({ ID: product });
    if (!existingProduct) {
        req.error(400, `Product with ID ${product} not found`);
        return;
    }

    // ✅ Ensure the customer exists
    const existingCustomer = await SELECT.one.from('Customers').where({ ID: customer });
    if (!existingCustomer) {
        req.error(400, `Customer with ID ${customer} not found`);
        return;
    }

    // ✅ Ensure sufficient stock before processing the sale
    if (existingProduct.stockLevel < quantity) {
        req.error(400, `Insufficient stock for product ${existingProduct.name}. Available: ${existingProduct.stockLevel}, Requested: ${quantity}`);
        return;
    }

    // ✅ Insert new sales record (without totalPrice)
    const [newSale] = await INSERT.into('Sales').entries({
        product: { ID: product },  // ✅ Ensure proper association reference
        quantity,
        unitPrice,
        saleDate,
        customer: { ID: customer },
        paymentMethod,
        status
    });

    // ✅ Reduce stock after successful sale
    await UPDATE('Products')
        .set({ stockLevel: existingProduct.stockLevel - quantity })
        .where({ ID: product });

    return newSale;
});


///////////////////////************GENERATE INVOICE *************///////////////////////////////////////

this.on("generateInvoice", async (req) => {
  debugger;
  const { sale } = req.data;  // Get sale ID from request

  // ✅ Fetch the sale record from the database
  const saleData = await SELECT.one.from("Sales").where({ ID: sale });

  if (!saleData) req.error(404, "Sale not found");

  // ✅ Fetch customer details
  const customerData = await SELECT.one.from("Customers").where({ ID: saleData.customer_ID });

  // ✅ Fetch product details
  const productData = await SELECT.one.from("Products").where({ ID: saleData.product_ID });

  if (!customerData || !productData) req.error(404, "Invalid customer or product");

  // 🔹 **Fix saleDate handling**
  let saleDateFormatted = "N/A"; // Default if saleDate is missing
  if (saleData.saleDate) {
      let saleDateObj = new Date(saleData.saleDate); // Convert to Date object
      if (!isNaN(saleDateObj.getTime())) {
          saleDateFormatted = saleDateObj.toISOString().split("T")[0]; // Format properly
      }
  }

  // ✅ Prepare Invoice Data
  const invoice = {
      invoiceNumber: `INV-${saleData.ID.substring(0, 8)}`,
      saleDate: saleDateFormatted,  // ✅ Use formatted date
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      productName: productData.name,
      quantity: saleData.quantity,
      unitPrice: saleData.unitPrice,
      totalPrice: saleData.quantity * saleData.unitPrice, // Calculate total price
      paymentMethod: saleData.paymentMethod,
      status: saleData.status,
  };

  return invoice;  // ✅ Return invoice data
});



  this.on('getTopSellingProducts', async (req) => {
    debugger
    const { limit } = req.data; // Get the limit from request

    const db = cds.transaction(req);

    try {
      const topProducts = await db.run(
        SELECT
          .from(Sales)
          .columns('product_ID', { totalSold: 'sum(quantity)' })
          .groupBy('product_ID')
          .orderBy({ totalSold: 'desc' })
          .limit(limit)
      );

      if (topProducts.length === 0) {
        return [];
      }

      // Fetch full product details
      const productIDs = topProducts.map(p => p.product_ID);
      const products = await db.run(
        SELECT.from(Products).where({ ID: productIDs })
      );

      return products;
    } catch (error) {
      console.error("Error fetching top-selling products:", error);
      req.error(500, "Failed to fetch top-selling products");
    }
    debugger
  });




  this.on('orderReplenishment', async (req) => {
    const lowStockProducts = await SELECT.from(Products).where({
      stockLevel: { '<': { reorderThreshold: 1 } }
    });

    // For each low stock product, check supplier and create an order
    for (let product of lowStockProducts) {
      const supplier = await SELECT.from(Suppliers).where({ ID: product.supplier.ID });
      const order = {
        product: product.ID,
        supplier: supplier[0].ID,
        orderQuantity: product.reorderThreshold - product.stockLevel,
        unitPrice: product.price,
        totalPrice: (product.reorderThreshold - product.stockLevel) * product.price,
        orderDate: new Date(),
        deliveryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default delivery 1 month after order
        status: 'Ordered',
      };
      await INSERT.into(SupplierOrders).entries(order);
    }
    return { message: 'Replenishment orders placed successfully' };
  });



  this.on('createLowStockAlerts', async () => {
    const lowStockProducts = await SELECT.from(Products).where({
      stockLevel: { '<': { reorderThreshold: 1 } }
    });

    for (let product of lowStockProducts) {
      const alert = {
        product: product.ID,
        alertType: 'Low Stock',
        message: `Product ${product.name} has low stock (below reorder threshold)`,
        status: 'Active',
        createdAt: new Date(),
      };
      await INSERT.into(Alerts).entries(alert);
    }
    return { message: 'Low stock alerts created' };
  });




});
