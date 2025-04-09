sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict"; 
    var id;

    return Controller.extend("app1.controller.EditProduct.", {
        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Products");
        },
        onInit: function () {
            debugger
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("EditProduct").attachPatternMatched(this._onProductMatched, this);
            oRouter.getRoute("EditProduct").attachPatternMatched(this._onRouteMatched, this);

            // Set an empty model initially (prevents binding issues)
            var oEmptyModel = new JSONModel({});
            this.getView().setModel(oEmptyModel, "productModel");
            // this._loadProductData()
            

        },


        _onRouteMatched: function (oEvent) {
            // ✅ Get product ID from the URL
            var productId = oEvent.getParameter("arguments").productId;
            debugger
        
            if (productId) {
                this._loadProductData(productId);
                debugger
            }
        },


        _onProductMatched: async function (oEvent) {
            debugger
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            var sProductId = oEvent.getParameter("arguments").productId;
            id = sProductId
            debugger
            var oFunction = oModel.bindContext("/editProduct(...)");
            oFunction.setParameter("productsId", sProductId);
            await oFunction.execute();

            var oProductData = oFunction.getBoundContext().getValue();
            console.log(oProductData);


            // 🔥 Simulate fetching data (replace with real API call)
            // var oProductData = {
            //     productId: sProductId,
            //     name: "Samsung Galaxy S23",
            //     description: "Latest flagship smartphone",
            //     category: "Electronics",
            //     price: 1099.99,
            //     stockLevel: 25,
            //     reorderThreshold: 5,
            //     supplierId: "SUP001"
            // };

            // // Set data to model
            var oProductModel = new JSONModel(oProductData);
            this.getView().setModel(oProductModel, "productModel");
        },


        onSaveEditProduct: async function (oEvent) {
            debugger
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();

            var selectedSupplierId = oView.byId("inputSupplier1").getSelectedKey();
            debugger
            // var sProductId = oEvent.getParameter("arguments").productId;
            // ✅ Bind Function Import
            var oFunction = oModel.bindContext("/updateProduct(...)");

            // ✅ Set Function Import Parameters
            oFunction
                .setParameter("ID", id)
                .setParameter("name", oView.byId("inputProductName").getValue() || "Default Product")
                .setParameter("description", oView.byId("inputDescription1").getValue() || "No description")
                .setParameter("category", oView.byId("inputCategory1").getValue() || "General")
                .setParameter("price", parseFloat(oView.byId("inputPrice1").getValue()) || 0)
                .setParameter("stockLevel", parseInt(oView.byId("inputStockLevel").getValue()) || 0)
                .setParameter("reorderThreshold", parseInt(oView.byId("inputReorderThreshold1").getValue()) || 0)
                .setParameter("supplier", selectedSupplierId); // ✅ Use Selected Supplier ID


            await oFunction.execute();
            var oProductResponse = await oFunction.getBoundContext().requestObject();
            console.log(oProductResponse);
            this.onNavBack();
        },



        _loadProductData: function (productId) {
            var oModel = this.getView().getModel(); // ✅ Get OData V4 Model
            var oView = this.getView();
        
            // ✅ Ensure product ID exists
            if (!productId) {
                console.error("Product ID is missing!");
                return;
            }
        
            // ✅ Bind the view to the product entity
            oView.bindElement({
                path: "/Products(ID='" + productId + "',IsActiveEntity=true)", // Adjust according to service
                parameters: {
                    expand: "supplier" // Expand supplier if needed
                },
                events: {
                    dataReceived: function (oEvent) {
                        var oData = oEvent.getParameter("data");
                        if (!oData) {
                            console.error("Product data not found for ID:", productId);
                        }
                    }
                }
            });
        }, 

        
        
        onDialogClose: async function (oEvent) {
            this.onNavBack();
        }



    });
});