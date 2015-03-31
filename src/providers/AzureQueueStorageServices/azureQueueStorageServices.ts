/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

/// <reference path="azurestoragequeueapi.ts" />
/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />



module AngularCloudDataConnector {
    export class AzureQueueStorageService implements IDataService {
        public azureClient: AzureStorageAPI.AzureStorageQueueApi;
        public dataAvailableCallback: (any) => void;

        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;


        public addSource(accountName: any, secretKey: string, queueNames) {
            var client = new AzureStorageAPI.AzureStorageQueueApi(secretKey, accountName);
            this.azureClient = client;
            this.tableNames = queueNames;
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

        private _getTable(queueName: string, callback: (result: any) => void, lastDate: Date): void {
            this.azureClient.getQueue(queueName, queue =>  {
                var result = { 'tableName': queueName, 'table': queue };
                callback(result);
            });
        }

        remove(queueName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            this.azureClient.deleteEntity(queueName, entity, onsuccess, onerror);
        }

        public update(queueName: string,  entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            delete entity.$$hashKey;
            this.azureClient.updateEntity(queueName, entity, onsuccess, onerror);
        }

        public add(queueName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            delete entity.$$hashKey;
            var Table = this.azureClient.insertEntity(queueName, entity, onsuccess, onerror);
        }
    }
}

// Angular
var angularCDCAzureQueueStorageServices = new AngularCloudDataConnector.AzureQueueStorageService();
angular.module('AngularCDC.AzureQueueStorageServices', []).value('angularCDCAzureQueueStorageServices', angularCDCAzureQueueStorageServices);
