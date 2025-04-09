namespace reports.analytics;


using {managed} from '@sap/cds/common';

// 🔹 Users & Roles
entity Users {
    key ID           : UUID;
        username     : String(50);
        email        : String(100);
        passwordHash : String(255);
        role         : String(20); // (Admin, Manager, Viewer)
        createdAt    : Timestamp;
        updatedAt    : Timestamp;
}

// 🔹 Customers Table
entity Customers {
    key ID          : UUID;
        name        : String(100);
        email       : String(100);
        phone       : String(20);
        address     : String(255);
        totalSpent  : Decimal(15, 2); // Total amount spent by the customer
        totalOrders : Integer; // Total number of orders made
        joinedAt    : Timestamp;
        lastOrderAt : Timestamp;
}

// 🔹 Products Table
entity  Products : managed {
    key ID               : UUID;
        name             : String(100);
        description      : String(255);
        category         : String(50);
        price            : Decimal(10, 2);
        stockLevel       : Integer;
        reorderThreshold : Integer; // Alert when stock falls below this
        supplier         : Association to Suppliers;
}

// 🔹 Suppliers Table
entity Suppliers: managed {
    key ID            : UUID;
        name          : String(100);
        contactPerson : String(100);
        contactEmail  : String(100);
        contactPhone  : String(20);
        address       : String(255);
        rating        : Integer; // (1-5) based on order fulfillment
        lastDelivery  : Date;
}

// 🔹 Sales Transactions Table
entity Sales : managed{
    key ID                 : UUID;
        product            : Association to Products;
        quantity           : Integer;
        unitPrice          : Decimal(10, 2);
        virtual totalPrice : Decimal(15, 2);
        saleDate           : Date;
        customer           : Association to Customers;
        paymentMethod      : String(50); // (Cash, Credit, Online)
        status             : String(20); // (Completed, Pending, Cancelled)
        
}

// 🔹 Stock Movements (Tracks Inventory Adjustments)
entity StockMovements {
    key ID           : UUID;
        product      : Association to Products;
        movementType : String(20); // (IN, OUT, ADJUSTMENT)
        quantity     : Integer;
        movementDate : Timestamp;
        reason       : String(255); // (Restock, Sale, Damage, Expired)
        createdAt    : Timestamp;
}

// 🔹 Order Management (Tracks Supplier Orders)
entity SupplierOrders {
    key ID            : UUID;
        supplier      : Association to Suppliers;
        product       : Association to Products;
        orderQuantity : Integer;
        unitPrice     : Decimal(10, 2);
        totalPrice    : Decimal(15, 2);
        orderDate     : Date;
        deliveryDate  : Date;
        status        : String(20); // (Ordered, Shipped, Delivered, Cancelled)
        createdAt     : Timestamp;
}

// 🔹 Reports & Analytics Table
entity Reports {
    key ID                  : UUID;
        reportDate          : Date;
        // Sales Insights
        totalSalesAmount    : Decimal(15, 2);
        totalOrders         : Integer;
        bestSellingProduct  : Association to Products;
        // Inventory Insights
        lowStockProducts    : Integer;
        highestStockProduct : Association to Products;
        // Supplier Performance
        supplierPerformance : Integer; // Average rating
        topSupplier         : Association to Suppliers;
        // Customer Insights
        newCustomers        : Integer;
        repeatCustomers     : Integer;
        topCustomer         : Association to Customers;
        createdAt           : Timestamp;
}

// 🔹 Alerts for Low Stock or Issues
entity Alerts {
    key ID        : UUID;
        product   : Association to Products;
        alertType : String(50); // (Low Stock, Order Delay, High Sales)
        message   : String(255);
        status    : String(20); // (Active, Resolved)
        createdAt : Timestamp;
}
