sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("app1.controller.Sales", {
        onInit: function () {
            console.log("Sales Page Loaded");
        },
        onAddSale: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("AddSales");
        },

        onGenerateInvoice: async function () {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();

            var saleID = oView.byId("salesTable").getSelectedItem()?.getBindingContext()?.getProperty("ID");
            if (!saleID) {
                MessageToast.show("Please select a sale to generate an invoice.");
                return;
            }

            var oFunction = oModel.bindContext("/generateInvoice(...)");
            oFunction.setParameter("sale", saleID);

            try {
                await oFunction.execute();
                var invoiceData = await oFunction.getBoundContext().requestObject();
                console.log("Invoice Data:", invoiceData);

                // ✅ Display Invoice in a Dialog or Download as PDF
                this.showInvoicePopup(invoiceData);
            } catch (error) {
                console.error("Error generating invoice:", error);
                MessageToast.show("Failed to generate invoice.");
            }
        },

        showInvoicePopup: function (invoiceData) {
            var sInvoiceHtml = `
        <h2>Invoice #${invoiceData.invoiceNumber}</h2>
        <p><b>Sale Date:</b> ${invoiceData.saleDate}</p>
        <p><b>Customer:</b> ${invoiceData.customerName} (${invoiceData.customerEmail})</p>
        <p><b>Product:</b> ${invoiceData.productName}</p>
        <p><b>Quantity:</b> ${invoiceData.quantity}</p>
        <p><b>Unit Price:</b> $${invoiceData.unitPrice}</p>
        <p><b>Total Price:</b> <b>$${invoiceData.totalPrice}</b></p>
        <p><b>Payment Method:</b> ${invoiceData.paymentMethod}</p>
        <p><b>Status:</b> ${invoiceData.status}</p>
    `;

            var oDialog = new sap.m.Dialog({
                title: "Invoice",
                content: new sap.ui.core.HTML({ content: sInvoiceHtml }),
                buttons: [
                    new sap.m.Button({
                        text: "Download PDF",
                        press: () => {
                            this.downloadInvoicePDF(invoiceData);
                            oDialog.close();
                        },
                    }),
                    new sap.m.Button({
                        text: "Close",
                        press: function () {
                            oDialog.close();
                        },
                    }),
                ],
            });

            oDialog.open();
        },

        downloadInvoicePDF: function (invoiceData) {
            var doc = new PDFDocument();
            var stream = doc.pipe(blobStream());

            doc.fontSize(20).text(`Invoice #${invoiceData.invoiceNumber}`, { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Sale Date: ${invoiceData.saleDate}`);
            doc.text(`Customer: ${invoiceData.customerName} (${invoiceData.customerEmail})`);
            doc.text(`Product: ${invoiceData.productName}`);
            doc.text(`Quantity: ${invoiceData.quantity}`);
            doc.text(`Unit Price: $${invoiceData.unitPrice}`);
            doc.text(`Total Price: $${invoiceData.totalPrice}`, { bold: true });
            doc.text(`Payment Method: ${invoiceData.paymentMethod}`);
            doc.text(`Status: ${invoiceData.status}`);

            doc.end();

            stream.on("finish", function () {
                var blob = stream.toBlob("application/pdf");
                var url = URL.createObjectURL(blob);
                window.open(url);
            });
        }
    });
});
