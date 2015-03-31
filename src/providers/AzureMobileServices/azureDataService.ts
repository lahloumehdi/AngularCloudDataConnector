/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />


declare var WindowsAzure;
 
module AngularCloudDataConnector {
    export class AzureDataService  implements IDataService {
        public azureClient: any; 
        public dataAvailableCallback: (any) => void;

        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;
        

        public addSource(urlOrClient: any, secretKey: string, tableNames) {
            var client = (urlOrClient.substring) ? new WindowsAzure.MobileServiceClient(urlOrClient, secretKey) : urlOrClient;
            this.azureClient = client;
            this.tableNames = tableNames;
        }

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        get(updateCallback: (result: any) => void, lastSyncDates: any): void {
            this.dataAvailableCallback = updateCallback;

            var count = 0;
            var total = this.tableNames.length;
            var result = [];

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                this._getTable(tableName, (resultElement) => {
                    count++;
                    updateCallback([resultElement]);
                    if (count == total) { } //!+ request is finished.  Might be interesting to have a callback to top level code called at this point.
                }, lastSyncDate);
            }
        }

        private _getTable(tableName: string, callback: (result:any) => void, lastDate: Date): void {
            var Table = this.azureClient.getTable(tableName);
            var firstCall = false;

            if (!lastDate) { // First call, need to get all rows
                lastDate = new Date(null);
                firstCall = true;
            }

            // Since the server sets the updateData and we are doiug a sort on date we assume we will never miss an item as long as we query from our latest update date.  

            Table.where(function (lastDateParam: Date, firstCallParam: boolean): boolean {
                return (firstCallParam && !this.sync_deleted) || (!firstCallParam && this.sync_updated > lastDateParam);
            }, lastDate, firstCall).orderBy("sync_updated").take(100).read().done(table => {

                //!!! Bug - need logic to send the query again until no more read.  Right now we only read 100 entries in our solution.

                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            }, err => {
                console.log(err);
                callback(null);
            });
        }

        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            var Table = this.azureClient.getTable(tableName);
            Table.del({ id: entity.id }).then(onsuccess, onerror);
        }

        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var Table = this.azureClient.getTable(tableName);
            delete entity.$$hashKey;
            Table.update(entity).then(newProperty => {
                onsuccess(newProperty);
            }, onerror);
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var Table = this.azureClient.getTable(tableName);
            delete entity.$$hashKey;
            Table.insert(entity).then(newProperty => {
                onsuccess(newProperty);
            }, onerror);
        }
    }
}

// Angular
var angularCDCAzureMobileService = new AngularCloudDataConnector.AzureDataService();
angular.module('AngularCDC.AzureMobileServices', []).value('angularCDCAzureMobileService', angularCDCAzureMobileService);
