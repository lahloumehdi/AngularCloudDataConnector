/// <reference path="../../core/References.d.ts" />

var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    var AzureDataService = (function () {
        function AzureDataService() {
            this.tableNames = new Array();
        }
        AzureDataService.prototype.addSource = function (url, secretKey, tableNames) {
            this.azureClient = new WindowsAzure.MobileServiceClient(url, secretKey);
            this.tableNames = tableNames;
        };

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        AzureDataService.prototype.get = function (callback, lastSyncDate) {
            var count = 0;
            var total = this.tableNames.length;
            var result = [];

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                this._getTable(tableName, function (resultElement) {
                    result[count] = resultElement;
                    count++;
                    if (count == total) {
                        callback(result);
                    }
                }, lastSyncDate);
            }
        };

        AzureDataService.prototype._getTable = function (tableName, callback, lastDate) {
            var Table = this.azureClient.getTable(tableName);
            var firstCall = false;

            if (!lastDate) {
                lastDate = new Date(null);
                firstCall = true;
            }

            // Since the server sets the updateData and we are doiug a sort on date we assume we will never miss an item as long as we query from our latest update date.
            //!!! This date needs to be tracked on a per table basis
            Table.where(function (lastDateParam, firstCallParam) {
                return (firstCallParam && !this.sync_deleted) || (!firstCallParam && this.sync_updated > lastDateParam);
            }, lastDate, firstCall).orderBy("sync_updated").take(100).read().done(function (table) {
                //!!! need logic to send the query again until no more read.
                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            }, function (err) {
                console.log(err);
                callback(null);
            });
        };

        AzureDataService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            var Table = this.azureClient.getTable(tableName);
            Table.del({ id: entity.id }).then(onsuccess, onerror);
        };

        AzureDataService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            var Table = this.azureClient.getTable(tableName);
            Table.insert(entity).then(function (newProperty) {
                onsuccess(newProperty);
            }, onerror);
        };
        return AzureDataService;
    })();
    AngularCloudDataConnector.AzureDataService = AzureDataService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));

// Angular
var azureDataService = new AngularCloudDataConnector.AzureDataService();
angular.module('AzureDataModule', []).value('azureDataService', azureDataService);
//# sourceMappingURL=azureDataService.js.map
