sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict"; 

    return Controller.extend("app1.controller.AddSales", {

        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Products");
        },

        
        onInit: function () {
            console.log("Sales Page Loaded");
        },
        onSaveSale: async function (oEvent) {
            debugger;
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();

            // ✅ Get selected Product ID
            var productID = oView.byId("inputProduct").getSelectedKey();
            if (!productID) {
                MessageToast.show("Please select a Product.");
                return;
            }

            // ✅ Get selected Customer ID
            var customerID = oView.byId("inputCustomer").getSelectedKey();
            if (!customerID) {
                MessageToast.show("Please select a Customer.");
                return;
            }

            // ✅ Use "$auto" to handle OData batch operations
            var sGroupId = "$auto";
            var saleDate = oView.byId("inputSaleDate").getValue();
if (saleDate) {
    saleDate = new Date(saleDate).toISOString().split("T")[0]; // Converts to YYYY-MM-DD
}


            // ✅ Bind Function Import
            var oFunction = oModel.bindContext("/addSales(...)");

            // ✅ Set Function Import Parameters
            oFunction
                .setParameter("product", productID)
                .setParameter("quantity", parseInt(oView.byId("inputQuantity").getValue()) || 1)
                .setParameter("unitPrice", parseFloat(oView.byId("inputUnitPrice").getValue()) || 0)
                .setParameter("saleDate",saleDate)
                .setParameter("customer", customerID)
                .setParameter("paymentMethod", oView.byId("inputPaymentMethod").getSelectedKey() || "Cash")
                .setParameter("status", oView.byId("inputStatus").getSelectedKey() || "Pending");

            console.log("Sending Sales Data:", JSON.stringify({
                product: productID,
                quantity: oView.byId("inputQuantity").getValue(),
                unitPrice: oView.byId("inputUnitPrice").getValue(),
                saleDate: oView.byId("inputSaleDate").getValue(),
                customer: customerID,
                paymentMethod: oView.byId("inputPaymentMethod").getSelectedKey(),
                status: oView.byId("inputStatus").getSelectedKey()
            }, null, 2));

            try {
                // ✅ Execute Function Import
                await oFunction.execute();

                // ✅ Retrieve Response
                var oSalesResponse = await oFunction.getBoundContext().requestObject();
                console.log("New Sales Record Created:", oSalesResponse);

                MessageToast.show("Sales record saved successfully!");
                this.onNavBack();
            } catch (error) {
                console.error("Error while saving sales record:", error);
                MessageToast.show("Failed to save sales record. Please try again.");
            }
        }

    });
});
