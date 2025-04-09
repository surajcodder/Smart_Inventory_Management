using reports.analytics as db from '../db/schema';

service ReportsService {

    // Expose Entities
    @odata.draft.enabled
    entity Products       as projection on db.Products;

    @odata.draft.enabled
    entity Suppliers      as projection on db.Suppliers;

    @odata.draft.enabled
    entity Sales          as projection on db.Sales;

    @odata.draft.enabled
    entity StockMovements as projection on db.StockMovements;

    @odata.draft.enabled
    entity SupplierOrders as projection on db.SupplierOrders;

    @odata.draft.enabled
    entity Customers      as projection on db.Customers;

    entity Reports        as projection on db.Reports;
    entity Alerts         as projection on db.Alerts;
    // Report Generation
    action   generateReport()                 returns Reports;


    function addProduct(name : String(100),
                        description : String(255),
                        category : String(50),
                        price : Decimal(10, 2),
                        stockLevel : Integer,
                        reorderThreshold : Integer,
                        supplier : UUID)      returns Products;


    function updateProduct(ID : UUID,
                           name : String(100),
                           description : String(255),
                           category : String(50),
                           price : Decimal(10, 2),
                           stockLevel : Integer,
                           reorderThreshold : Integer,
                           supplier : UUID)   returns Products;


    function editProduct(productsId : UUID)   returns Products;

    function deleteProduct(productsId : UUID) returns Boolean;



    function addSales(
    product         : UUID,
    quantity        : Integer,
    unitPrice       : Decimal(10,2),
    saleDate        : Date,
    customer        : UUID,
    paymentMethod   : String(50), // (Cash, Credit, Online)
    status          : String(20)  // (Completed, Pending, Cancelled)
) returns Sales;


// Custom Actions
action getSalesReport(startDate : Date, endDate : Date) returns array of Sales;
action getLowStockProducts()                            returns array of Products;
action getTopSellingProducts(limit : Integer)           returns array of Products;
action getCustomerReport(customerID : UUID)             returns Customers;
action getTopCustomers(limit : Integer)                 returns array of Customers;

function generateInvoice(sale: UUID) returns Invoice;
type Invoice {
        invoiceNumber: String(20);
        saleDate: Date;
        customerName: String(100);
        customerEmail: String(100);
        customerPhone: String(20);
        productName: String(100);
        quantity: Integer;
        unitPrice: Decimal(10,2);
        totalPrice: Decimal(15,2);
        paymentMethod: String(50);
        status: String(20);
    }

}
