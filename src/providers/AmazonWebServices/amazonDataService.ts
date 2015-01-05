/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/angular-cdc.d.ts" />


declare var AWS;

module AngularCloudDataConnector {
    export class AWSDataService implements IDataService {
        public AWSClient: any;
        public dataAvailableCallback: (any) => void;
        private deletedItem: any;
        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;
        public initSource(AccountId: string, RoleArn: string, idPool, region: string, tableNames) {
            AWS.config.region = region;

            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                AccountId: AccountId,
                IdentityPoolId: idPool,
                RoleArn: RoleArn
            });

            AWS.config.credentials.get(function (r) {
            });

            this.AWSClient = new AWS.DynamoDB();
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
                this._getTable(tableName, function (resultElement) {
                    count++;
                    updateCallback([resultElement]);
                    if (count == total) {
                    }
                }, lastSyncDate);
            }
        }

        private _getTable(tableName: string, callback: (result: any) => void, lastDate: Date): void {
            var Table = new AWS.DynamoDB({ params: { TableName: tableName } });
            var firstCall = false;

            if (!lastDate) {
                lastDate = new Date(null);
                firstCall = true;
            }
            var that = this;
            // Since the server sets the updateData and we are doing a sort on date we assume we will never miss an item as long as we query from our latest update date.
            this.AWSClient.scan({ TableName: tableName }, function (err, table) {
                if (err) {
                    console.log(err);
                    callback(null);
                } else {
                    var items = [];
                    for (var i = 0; i < table.Items.length; i++) {
                        // create the item with the correct mapping for DynamoDB
                        var item = {}
                        for (var x in table.Items[i]) {
                            item[x] = table.Items[i][x].S;
                        }
                        items.push(item);
                    }
                    if (that.deletedItem)
                        items.push(that.deletedItem);
                    var result = { 'tableName': tableName, 'table': items };

                    callback(result);
                    that.deletedItem = null;
                }
            });
        }

        //remove an entity
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            var dynDB = new AWS.DynamoDB();
            this.deletedItem = entity;
            this.deletedItem.sync_deleted = true;
            dynDB.deleteItem({
                "TableName": tableName,
                "Key": { "id": { "S": entity.id + "" } },
                "ReturnValues": "ALL_OLD"
            }, onsuccess, onerror);
        }

        //update an entity
        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var dynDB = new AWS.DynamoDB();
            var item = {};
            // create the item with the correct mapping for DynamoDB
            for (var i in entity) {
                if (typeof (entity[i]) != 'function' && i != 'id')
                    item[i] = { "Value": { "S": entity[i] }, "Action": "PUT" };
            }

            dynDB.updateItem({
                'TableName': tableName,
                "Key": { "id": { "S": entity.id } },
                "AttributeUpdates": item,
                "Expected": {},
            }, function (e) { }, onerror);

        }

        //add an entity
        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var dynDB = new AWS.DynamoDB();
            delete entity.$$hashKey;
            entity.id = Math.random() + '';
            // create the item with the correct mapping for DynamoDB
            var item = {};
            for (var i in entity) {
                if (typeof (entity[i]) != 'function')
                    item[i] = { "S": entity[i] };
            }
            dynDB.putItem({
                'TableName': tableName,
                "Item": item,
                "Expected": {},
            }, onsuccess, onerror);
        }
    }
}

// Angular
var angularCDCAWS = new AngularCloudDataConnector.AWSDataService();
angular.module('AngularCDC.AWS', []).value('angularCDCAWS', angularCDCAWS);
