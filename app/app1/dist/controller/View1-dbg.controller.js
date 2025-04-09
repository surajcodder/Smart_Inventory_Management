sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast" 
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("app1.controller.View1", {
        onInit: function () {
            this._loadPdfMake();
            var oModel = new sap.ui.model.json.JSONModel();

            var oData = {
                chartData: [
                    { month: "Jan", products: 120, sales: 5000 },
                    { month: "Feb", products: 150, sales: 7000 },
                    { month: "Mar", products: 180, sales: 8500 },
                    { month: "Apr", products: 200, sales: 9000 },
                    { month: "May", products: 170, sales: 8000 },
                    { month: "Jun", products: 190, sales: 8800 }
                ]
            };

            oModel.setData(oData);
            this.getView().setModel(oModel, "chartModel");

            var oVizFrame = this.getView().byId("salesChart");

            if (!oVizFrame) {
                console.error("VizFrame not found. Check XML view ID.");
                return;
            }

            // Apply color settings after render to ensure proper visualization
            oVizFrame.attachEventOnce("renderComplete", function () {
                oVizFrame.setVizProperties({
                    plotArea: {
                        colorPalette: ["#3D8D7A", "#B3D8A8"], // ✅ Custom Colors for different bars
                        dataLabel: { visible: true },
                        animation: { dataLoading: true, dataUpdating: true }
                    },
                    legend: { visible: false }, // Optional: Hide legend if not needed
                    title: {
                        text: "Monthly Sales & Products Sold",
                        visible: true
                    }
                });
            });
        },




        onAfterRendering: function () {
            var oListItems = this.getView().byId("_IDGenList").getItems();
            oListItems[0].addStyleClass("redGlow");     // Low stock alert (red)
            oListItems[1].addStyleClass("yellowGlow");  // Pending supplier order (yellow)
            oListItems[2].addStyleClass("greenGlow");   // High sales (green)
        },



        onNavToProducts: function () {
            debugger
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Products"); // This should match the "name" in routes
            debugger
        },
        onNavToSales: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Sales");
        },


        onGenerateInvoice: async function () {
            debugger;
            var oModel = this.getOwnerComponent().getModel(); // OData V4 Model
        
            try {
                // 🔹 Fetch all sales data
                var oBinding = oModel.bindContext("/Sales");
                var oSalesData = await oBinding.requestObject();
        
                if (!oSalesData || !oSalesData.value || oSalesData.value.length === 0) {
                    sap.m.MessageToast.show("No sales data available.");
                    return;
                }
        
                console.log("✅ Sales Data:", oSalesData.value);
        
                // 🔹 Open Popup with Sales Selection
                this._showSalesSelectionPopup(oSalesData.value);
        
            } catch (error) {
                console.error("❌ Error fetching sales data:", error);
                sap.m.MessageToast.show("Failed to fetch sales data.");
            }
        },
        
        /** 🔹 Display Sales Data in a Dialog for Selection */
        _showSalesSelectionPopup: function (aSalesData) {
            var that = this;
        
            if (!this.oSalesDialog) {
                this.oSalesDialog = new sap.m.Dialog({
                    title: "Select Sales for Invoice",
                    contentWidth: "500px",
                    contentHeight: "400px",
                    resizable: true,
                    draggable: true,
                    content: [
                        new sap.m.List({
                            id: "salesList",
                            mode: "MultiSelect", // ✅ Enable multiple selection
                            items: {
                                path: "/Sales",  // ✅ Correct binding to array
                                template: new sap.m.StandardListItem({
                                    title: "{ID}",  // Show ID (or Sale Number if available)
                                    description: "{totalPrice} USD - {paymentMethod}",
                                    selected: "{isSelected}" // Optional binding for selection state
                                })
                            }
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Generate Invoice",
                        type: "Emphasized",
                        press: function () {
                            that._processSelectedSales();
                            that.oSalesDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            that.oSalesDialog.close();
                        }
                    })
                });
        
                this.getView().addDependent(this.oSalesDialog);
            }
        
            // ✅ Convert Data for List Binding
            var oDialogModel = new sap.ui.model.json.JSONModel({ Sales: aSalesData });
            this.oSalesDialog.setModel(oDialogModel);
        
            this.oSalesDialog.open();
        },        
        
        /** 🔹 Process Selected Sales and Generate Invoices */
        _processSelectedSales: async function () {
            var oDialogModel = this.oSalesDialog.getModel();
            var aSelectedSales = oDialogModel.getProperty("/Sales").filter(sale => sale.isSelected);
        
            if (!aSelectedSales.length) {
                sap.m.MessageToast.show("Please select at least one sale.");
                return;
            }
        
            var oModel = this.getOwnerComponent().getModel();
        
            for (let sale of aSelectedSales) {
                var oFunction = oModel.bindContext("/generateInvoice(...)");
                oFunction.setParameter("sale", sale.ID);
                try {
                    await oFunction.execute();
                    var invoiceData = await oFunction.getBoundContext().requestObject();
                    console.log(`✅ Invoice Data for Sale ID ${sale.ID}:`, invoiceData);
                    this.showInvoicePopup(invoiceData);
                } catch (error) {
                    console.error(`❌ Error generating invoice for Sale ID ${sale.ID}:`, error);
                    sap.m.MessageToast.show(`Failed to generate invoice for Sale ID ${sale.ID}.`);
                }
            }
        },        

        showInvoicePopup: function (invoiceData) {
            // Convert unitPrice and totalPrice to numbers
            var unitPrice = parseFloat(invoiceData.unitPrice) || 0;
            var totalPrice = parseFloat(invoiceData.totalPrice) || 0;

            // Build HTML with inline styling for a nicer layout
            var sInvoiceHtml = `
                <div style="font-family: Arial, sans-serif; padding: 10px; max-width: 400px;">
                    <h2 style="color: #007aff; text-align: center;">🧾 Invoice #${invoiceData.invoiceNumber}</h2>
                    <hr style="border: 1px solid #ddd;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td><b>Sale Date:</b></td><td>${invoiceData.saleDate}</td></tr>
                        <tr><td><b>Customer:</b></td><td>${invoiceData.customerName} (${invoiceData.customerEmail})</td></tr>
                        <tr><td><b>Product:</b></td><td>${invoiceData.productName}</td></tr>
                        <tr><td><b>Quantity:</b></td><td>${invoiceData.quantity}</td></tr>
                        <tr><td><b>Unit Price:</b></td><td>$${unitPrice.toFixed(2)}</td></tr>
                        <tr style="background: #f5f5f5;">
                            <td><b>Total Price:</b></td>
                            <td style="font-weight: bold; color: #d9534f;">$${totalPrice.toFixed(2)}</td>
                        </tr>
                        <tr><td><b>Payment Method:</b></td><td>${invoiceData.paymentMethod}</td></tr>
                        <tr><td><b>Status:</b></td><td>${invoiceData.status}</td></tr>
                    </table>
                    <hr style="border: 1px solid #ddd;">
                </div>
            `;

            var oDialog = new sap.m.Dialog({
                title: "Invoice Details",
                icon: "sap-icon://document-text",
                contentWidth: "450px",
                type: sap.m.DialogType.Message,
                content: new sap.ui.core.HTML({ content: sInvoiceHtml }),
                buttons: [
                    new sap.m.Button({
                        text: "Preview PDF",
                        type: "Emphasized",
                        press: () => {
                            this.previewInvoicePDF(invoiceData);
                        }
                    }),
                    new sap.m.Button({
                        text: "Download PDF",
                        type: "Accept",
                        press: () => {
                            this.downloadInvoicePDF(invoiceData);
                            oDialog.close();
                        }
                    }),
                    new sap.m.Button({
                        text: "Close",
                        type: "Reject",
                        press: function () {
                            oDialog.close();
                        }
                    })
                ]
            });

            oDialog.open();
        },

        previewInvoicePDF: function (invoiceData) {
            if (!pdfMake) {
                sap.m.MessageToast.show("PDF library (pdfMake) not loaded!");
                return;
            }
        
            let unitPrice = Number(invoiceData.unitPrice) || 0;
            let totalPrice = Number(invoiceData.totalPrice) || 0;
        
            var docDefinition = {
                content: [
                    { text: "🧾 Invoice Preview", style: "header", alignment: "center", margin: [0, 10, 0, 10] },
                    { text: `Invoice Number: ${invoiceData.invoiceNumber}`, style: "subheader" },
                    { text: `Sale Date: ${invoiceData.saleDate}`, style: "details" },
        
                    { text: "\nCustomer Details", style: "sectionHeader" },
                    {
                        table: {
                            widths: ["50%", "50%"],
                            body: [
                                ["Name", invoiceData.customerName],
                                ["Email", invoiceData.customerEmail],
                                ["Phone", invoiceData.customerPhone || "N/A"],
                            ],
                        },
                        layout: "lightHorizontalLines",
                        margin: [0, 5, 0, 15],
                    },
        
                    { text: "Product Details", style: "sectionHeader" },
                    {
                        table: {
                            widths: ["40%", "20%", "20%", "20%"],
                            body: [
                                ["Product", "Quantity", "Unit Price", "Total"],
                                [
                                    invoiceData.productName,
                                    invoiceData.quantity,
                                    `$${unitPrice.toFixed(2)}`,
                                    { text: `$${totalPrice.toFixed(2)}`, bold: true, color: "#d9534f" },
                                ],
                            ],
                        },
                        layout: "headerLineOnly",
                        margin: [0, 5, 0, 15],
                    },
        
                    { text: "Payment Details", style: "sectionHeader" },
                    { text: `Payment Method: ${invoiceData.paymentMethod}`, style: "details" },
                    { text: `Status: ${invoiceData.status}`, style: "details" },
        
                    { text: "\nThis is a preview. Click 'Download PDF' to save it.", style: "footer", alignment: "center" },
                ],
        
                styles: {
                    header: { fontSize: 18, bold: true },
                    subheader: { fontSize: 14, bold: true },
                    sectionHeader: { fontSize: 12, bold: true, color: "#007aff", margin: [0, 10, 0, 5] },
                    details: { fontSize: 10, margin: [0, 2, 0, 2] },
                    footer: { fontSize: 10, italics: true, margin: [0, 20, 0, 0] },
                },
            };
        
            var oDialog = new sap.m.Dialog({
                title: "Invoice Preview",
                contentWidth: "700px",
                contentHeight: "80%",
                resizable: true,
                draggable: true,
                content: new sap.ui.core.HTML({
                    content: `
                        <div style="height: 100%; display: flex; flex-direction: column;">
                            <iframe id="pdfPreview" style="flex-grow: 1; width: 100%; height: 600px; border: none;"></iframe>
                        </div>
                    `,
                }),
                buttons: [
                    new sap.m.Button({
                        text: "Close",
                        type: "Reject",
                        press: function () {
                            oDialog.close();
                        },
                    }),
                ],
                afterOpen: function () {
                    pdfMake.createPdf(docDefinition).getDataUrl(function (dataUrl) {
                        document.getElementById("pdfPreview").src = dataUrl;
                    });
                },
            });
        
            oDialog.open();
        },        
        
        downloadInvoicePDF: function (invoiceData) {
            if (!pdfMake) {
                sap.m.MessageToast.show("PDF library (pdfMake) not loaded!");
                return;
            }
        
            let unitPrice = Number(invoiceData.unitPrice) || 0;
            let totalPrice = Number(invoiceData.totalPrice) || 0;
        
            var docDefinition = {
                content: [
                    { text: "🧾 Invoice", style: "header", alignment: "center", margin: [0, 10, 0, 10] },
                    { text: `Invoice Number: ${invoiceData.invoiceNumber}`, style: "subheader" },
                    { text: `Sale Date: ${invoiceData.saleDate}`, style: "details" },
        
                    { text: "\nCustomer Details", style: "sectionHeader" },
                    {
                        table: {
                            widths: ["50%", "50%"],
                            body: [
                                ["Name", invoiceData.customerName],
                                ["Email", invoiceData.customerEmail],
                                ["Phone", invoiceData.customerPhone || "N/A"],
                            ],
                        },
                        layout: "lightHorizontalLines",
                        margin: [0, 5, 0, 15],
                    },
        
                    { text: "Product Details", style: "sectionHeader" },
                    {
                        table: {
                            widths: ["40%", "20%", "20%", "20%"],
                            body: [
                                ["Product", "Quantity", "Unit Price", "Total"],
                                [
                                    invoiceData.productName,
                                    invoiceData.quantity,
                                    `$${unitPrice.toFixed(2)}`,
                                    { text: `$${totalPrice.toFixed(2)}`, bold: true, color: "#d9534f" },
                                ],
                            ],
                        },
                        layout: "headerLineOnly",
                        margin: [0, 5, 0, 15],
                    },
        
                    { text: "Payment Details", style: "sectionHeader" },
                    { text: `Payment Method: ${invoiceData.paymentMethod}`, style: "details" },
                    { text: `Status: ${invoiceData.status}`, style: "details" },
        
                    { text: "\nThank you for your business!", style: "footer", alignment: "center" },
                ],
        
                styles: {
                    header: { fontSize: 18, bold: true },
                    subheader: { fontSize: 14, bold: true },
                    sectionHeader: { fontSize: 12, bold: true, color: "#007aff", margin: [0, 10, 0, 5] },
                    details: { fontSize: 10, margin: [0, 2, 0, 2] },
                    footer: { fontSize: 10, italics: true, margin: [0, 20, 0, 0] },
                },
            };
        
            pdfMake.createPdf(docDefinition).download(`Invoice_${invoiceData.invoiceNumber}.pdf`);
        },
        
        





        _loadPdfMake: function () {
            if (typeof pdfMake === "undefined") {
                jQuery.sap.includeScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js",
                    "pdfMakeLib"
                );
                jQuery.sap.includeScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js",
                    "pdfMakeFonts"
                );
            }
        },





        // downloadInvoicePDF: function (invoiceData) {
        //     if (typeof pdfMake === "undefined") {
        //         MessageToast.show("PDF library not loaded. Please try again.");
        //         return;
        //     }

        //     var docDefinition = {
        //         content: [
        //             { text: `Invoice #${invoiceData.invoiceNumber}`, style: 'header' },
        //             { text: `Sale Date: ${invoiceData.saleDate}`, style: 'subheader' },
        //             { text: `Customer: ${invoiceData.customerName} (${invoiceData.customerEmail})`, margin: [0, 10, 0, 0] },
        //             { text: `Product: ${invoiceData.productName}` },
        //             { text: `Quantity: ${invoiceData.quantity}` },
        //             { text: `Unit Price: $${invoiceData.unitPrice}` },
        //             { text: `Total Price: $${invoiceData.totalPrice}`, bold: true, fontSize: 14, margin: [0, 10, 0, 0] },
        //             { text: `Payment Method: ${invoiceData.paymentMethod}` },
        //             { text: `Status: ${invoiceData.status}` },
        //         ],
        //         styles: {
        //             header: { fontSize: 18, bold: true, alignment: 'center' },
        //             subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        //         }
        //     };

        //     pdfMake.createPdf(docDefinition).download(`invoice_${invoiceData.invoiceNumber}.pdf`);
        // }
              

    });
});