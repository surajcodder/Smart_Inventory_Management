sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("app1.controller.ProductsAdd", {

        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Products");
        },

        onSaveProduct: async function () {
            debugger;
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();

            // ✅ Get selected Supplier ID instead of generating a new UUID
            var supplierID = oView.byId("inputSupplier").getSelectedKey();
            if (!supplierID) {
                MessageToast.show("Please select a Supplier.");
                return;
            }

            // ✅ Use "$auto" to automatically handle OData batch operations
            var sGroupId = "$auto";

            // ✅ Bind Function Import
            var oFunction = oModel.bindContext("/addProduct(...)");

            // ✅ Set Function Import Parameters
            oFunction
                .setParameter("name", oView.byId("inputName").getValue() || "Default Product")
                .setParameter("description", oView.byId("inputDescription").getValue() || "No description")
                .setParameter("category", oView.byId("inputCategory").getValue() || "General")
                .setParameter("price", parseFloat(oView.byId("inputPrice").getValue()) || 0)
                .setParameter("stockLevel", parseInt(oView.byId("inputStock").getValue()) || 0)
                .setParameter("reorderThreshold", parseInt(oView.byId("inputReorderThreshold").getValue()) || 0)
                .setParameter("supplier", supplierID); // ✅ Use Selected Supplier ID

            console.log("Sending Product Data:", JSON.stringify({
                name: oView.byId("inputName").getValue(),
                description: oView.byId("inputDescription").getValue(),
                category: oView.byId("inputCategory").getValue(),
                price: oView.byId("inputPrice").getValue(),
                stockLevel: oView.byId("inputStock").getValue(),
                reorderThreshold: oView.byId("inputReorderThreshold").getValue(),
                supplier: supplierID.toString()
            }, null, 2));

            try {
                // ✅ Execute Function Import
                await oFunction.execute();

                // ✅ Properly Retrieve Response
                var oProductResponse = await oFunction.getBoundContext().requestObject();
                console.log("New Product Created:", oProductResponse);

                MessageToast.show("Product saved successfully!");
                this.onNavBack();
            } catch (error) {
                console.error("Error while saving product:", error);
                MessageToast.show("Failed to save product. Please try again.");
            }
        }
    });
});
