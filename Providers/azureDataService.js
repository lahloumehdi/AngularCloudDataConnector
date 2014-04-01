/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

var dataModule = angular.module('AzureDataModule', []);
dataModule.value('azureDataService',
{

    azureClient: null,
    tableNames : [],

    addSource: function (url, secretKey, tableNames) {
        azureClient = new WindowsAzure.MobileServiceClient(url, secretKey);
        this.tableNames = tableNames;
    },

    
    // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
    get: function (callback, lastSyncDate) {
        var count = 0;
        var total = this.tableNames.length;
        var result = [];
        var that = this;
        var tableName;
        for (var x = 0; x < total; x++) {
            tableName = this.tableNames[x];
            that.getTable(tableName,
                function (resultElement) {
                    result[count] = resultElement;                    
                    count++;
                    if (count == total) {
                        callback(result);
                    }
                }, lastSyncDate);
        }
    },

    getTable: function (tableName, callback, lastDate) {
        var Table = azureClient.getTable(tableName);
        var firstCall = false;

        if (!lastDate) { // First call, need to get all rows
            lastDate = new Date(null);
            firstCall = true;
        }

        // Since the server sets the updateData and we are doiug a sort on date we assume we will never miss an item as long as we query from our latest update date.  
        //!!! This date needs to be tracked on a per table basis
        Table.where(function (lastDate, firstCall) {
            return (firstCall && !this.deleted) || (!firstCall && this.updateDate > lastDate);
        }, lastDate, firstCall).orderBy("updateDate").take(100).read().done(function (table) {
            //!!! need logic to send the query again until no more read.
            var result = { 'tableName': tableName, 'table': table };
            callback(result);
        }, function (err) {
            console.log(err);
            callback(null);
        });
    },

    remove: function (tableName, entity, onsuccess, onerror) {
        var Table = azureClient.getTable(tableName);
        Table.del({ id: entity.id }).then(onsuccess, onerror);
    },

    add: function (tableName, entity, onsuccess, onerror) {
        var Table = azureClient.getTable(tableName);
        Table.insert(entity).then(function (newProperty) {
            onsuccess(newProperty);
        }, onerror);
    }
});
