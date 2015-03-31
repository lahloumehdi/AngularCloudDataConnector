/// <reference path="azurestoragetableapi.ts" />
/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />



module AngularCloudDataConnector {
    export class AzureTableStorageService implements IDataService {
        public azureClient: AzureStorageTableApi;
        public dataAvailableCallback: (any) => void;

        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;


        public addSource(accountName: any, secretKey: string, tableNames) {
            var client = new AzureStorageTableApi(secretKey, accountName);
            this.azureClient = client;
            this.tableNames = tableNames;
        }

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        get(updateCallback: (result: any) => void, lastSyncDates: any): void {
            this.dataAvailableCallback = updateCallback;

            var count = 0;
            var total = this.tableNames.length;

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                this._getTable(tableName, (resultElement) => {
                    count++;
                    updateCallback([resultElement]);
                    if (count === total) { } //!+ request is finished.  Might be interesting to have a callback to top level code called at this point.
                }, lastSyncDate);
            }
        }

        private _getTable(tableName: string, callback: (result: any) => void, lastDate: Date): void {
            this.azureClient.getTable(tableName, table => {
                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            });
        }

        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            this.azureClient.deleteEntity(tableName, entity, onsuccess, onerror);
        }

        public update(tableName: string,  entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            delete entity.$$hashKey;
            this.azureClient.updateEntity(tableName, entity, onsuccess, onerror);
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            delete entity.$$hashKey;
            this.azureClient.insertEntity(tableName, entity, onsuccess, onerror);
        }
    }
}

// Angular
var angularCDCAzureTableStorageServices = new AngularCloudDataConnector.AzureTableStorageService();
angular.module('AngularCDC.AzureTableStorageServices', []).value('angularCDCAzureTableStorageServices', angularCDCAzureTableStorageServices);
