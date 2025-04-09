sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("app1.controller.Products", {
        onInit: function () {
            console.log("Products Page Loaded");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("Products").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function () {
            var oModel = this.getOwnerComponent().getModel();
            if (oModel.requestRefresh) {
                oModel.requestRefresh(); // OData V4 model refresh
            } else {
                oModel.refresh(); // For JSON or OData V2 models
            }
            console.log("Model refreshed successfully"); // Debugging log
        },



        onAddProduct: function () {
            debugger
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("AddProduct", {}, true);
            debugger
        },
        onEditProduct: function (oEvent) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            debugger

            // Get selected product's ID
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var sProductID = oContext.getProperty("ID"); // Adjust according to your model

            // Navigate to EditProduct page with Product ID
            oRouter.navTo("EditProduct", {
                productId: sProductID
            });

            // oRouter.navTo("EditProduct");
        },

        onDeleteProduct: async function (oEvent) {
            debugger;
            var oModel = this.getOwnerComponent().getModel();
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var sProductID = oContext.getProperty("ID"); // Adjust according to your model
            debugger;

            try {
                // Bind the OData function import (Action in OData V4)
                var oFunction = oModel.bindContext("/deleteProduct(...)");

                // Set the required parameter for the function
                oFunction.setParameter("productsId", sProductID);

                // Execute the function
                await oFunction.execute();

                // Refresh the list to reflect the deleted item
                if (oModel.requestRefresh) {
                    await oModel.requestRefresh(); // Works for OData V4
                } else if (oModel.refresh) {
                    oModel.refresh(); // Works for JSONModel or OData V2
                } else {
                    console.warn("Model does not support refresh methods.");
                }

                console.log("Product deleted successfully and model refreshed");
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        },





        // ✅ Search Functionality
        onSearch: function (oEvent) {
            debugger
            var sQuery = oEvent.getParameter("newValue"); // Get search input
            var oTable = this.getView().byId("productTable"); // Get Table

            if (!oTable) {
                console.error("Table with ID 'productTable' not found.");
                return;
            }

            var oBinding = oTable.getBinding("items"); // Get table binding
            if (!oBinding) {
                console.error("Table binding is undefined. Ensure the model is loaded.");
                return;
            }

            // Apply filter only if query exists
            var aFilters = [];
            if (sQuery) {
                aFilters = [
                    new Filter("name", FilterOperator.Contains, sQuery),
                    new Filter("category", FilterOperator.Contains, sQuery)
                    // new Filter("price", FilterOperator.Contains, sQuery),
                    // new Filter("stockLevel", FilterOperator.Contains, sQuery)
                ];
            }
        
            // Combine filters with OR condition
            var oFinalFilter = aFilters.length > 0 ? new Filter({ filters: aFilters, and: false }) : null;
        
            // Apply filter
            oBinding.filter(oFinalFilter ? [oFinalFilter] : []);
        },

    });
});
