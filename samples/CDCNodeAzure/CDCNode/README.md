# CDC with Express on Node.js

To use cdc you have to add the cdc node module (located in /node_modules) and add the azure-storage module using npm.

Init the CDC service and Azure Data Service
 ```javascript
that.initCDC = function (callback) {
    that.CDCAzureTableStorageService = new CloudDataConnector.AzureTableStorageService();
    that.CDCService = new CloudDataConnector.DataService(new CloudDataConnector.OfflineService(), new CloudDataConnector.ConnectivityService());
    that.CDCAzureTableStorageService.addSource('cdcsamplesstorage', // accountName
              'TKjI04s1vL3DvgbVFL64RTjEkonDE1g3lkmI+FO2PH7lIDMv7N/sGUrOAzo23m2aBIwYMnw7BFhEfiVU3ctoVA==',  // secretKey
                 ['people']);      // table name
    that.CDCService.addSource(that.CDCAzureTableStorageService);
    var post = [];
    var updateIndex;
    var onUpdateDataContext = function (data) {
        if (data && data.length) {
            post = data;
            callback();
        }
    }
    that.dataContext = {};
    that.CDCService.connect(function (results) {
        if (results === false) {
            throw "CDCService must first be successfully initialized";
        }
        else {
            // We are good to go
        }
    }, that.dataContext, onUpdateDataContext, 3);
}
```
You are ready ! You can now perform add, change, delete requests
