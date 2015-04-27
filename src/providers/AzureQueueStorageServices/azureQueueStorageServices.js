/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="azurestoragequeueapi.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />
var CloudDataConnector;
(function (CloudDataConnector) {
    var AzureQueueStorageService = (function () {
        function AzureQueueStorageService() {
            this.tableNames = new Array();
        }
        AzureQueueStorageService.prototype.addSource = function (accountName, secretKey, queueNames) {
            var client = new AzureStorageAPI.AzureStorageQueueApi(secretKey, accountName);
            this.azureClient = client;
            this.tableNames = queueNames;
        };

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        AzureQueueStorageService.prototype.get = function (updateCallback, lastSyncDates) {
            this.dataAvailableCallback = updateCallback;

            var count = 0;
            var total = this.tableNames.length;

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                this._getTable(tableName, function (resultElement) {
                    count++;
                    updateCallback([resultElement]);
                    if (count === total) {
                    }
                }, lastSyncDate);
            }
        };

        AzureQueueStorageService.prototype._getTable = function (queueName, callback, lastDate) {
            this.azureClient.getQueue(queueName, function (queue) {
                var result = { 'tableName': queueName, 'table': queue };
                callback(result);
            });
        };

        AzureQueueStorageService.prototype.remove = function (queueName, entity, onsuccess, onerror) {
            this.azureClient.deleteEntity(queueName, entity, onsuccess, onerror);
        };

        AzureQueueStorageService.prototype.update = function (queueName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            this.azureClient.updateEntity(queueName, entity, onsuccess, onerror);
        };

        AzureQueueStorageService.prototype.add = function (queueName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            var Table = this.azureClient.insertEntity(queueName, entity, onsuccess, onerror);
        };
        return AzureQueueStorageService;
    })();
    CloudDataConnector.AzureQueueStorageService = AzureQueueStorageService;
})(CloudDataConnector || (CloudDataConnector = {}));
//# sourceMappingURL=azureQueueStorageServices.js.map
