/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/angular-cdc.d.ts" />

interface JQueryStatic {
    couch: any;
}
module AngularCloudDataConnector {
    export class couchDBDataService implements IDataService {
        public azureClient: any;
        public dataAvailableCallback: (any) => void;

        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;


        public initSource(urlPrefix: string, tableNames) {
            $.couch.urlPrefix = urlPrefix;
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
                    if (count === total) {
                    }
                }, lastSyncDate);
            }
        }

        private _getTable(tableName: string, callback: (result: any) => void, lastDate: Date): void {
            var firstCall = false;
            if (!lastDate) {
                lastDate = new Date(null);
                firstCall = true;
            }

            var that = this;
            // Since the server sets the updateData and we are doing a sort on date we assume we will never miss an item as long as we query from our latest update date.

            $.couch.db(tableName).allDocs({
                success: function (data) {

                    var result = { 'tableName': tableName, 'table': data.rows };
                    var table = [];
                    data.rows.forEach(function (row, index) {
                        $.couch.db(tableName).openDoc(row.id, {
                            attachPrevRev: true,
                            success: function (d) {
                                d.id = d._id;
                                table.push(d);
                                if (table.length === data.rows.length)
                                    callback({ 'tableName': tableName, 'table': table });
                            },
                            error: function (e) {
                                callback({ 'tableName': tableName, 'table': [] });
                            }
                        });
                    })

                },
                error: function (e) {
                    callback({ 'tableName': tableName, 'table': [] });
                }
            });
        }

        remove(tableName: string, entity: any, onsuccess: (data: any) => void, onerror: (error: string) => void): void {
            $.couch.db(tableName).removeDoc({ _id: entity._id, _rev: entity._rev })({
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        }

        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            $.couch.db(tableName).saveDoc(entity, {
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            delete entity.$$hashKey;
            $.couch.db(tableName).saveDoc(entity, {
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        }
    }
}

// Angular
var angularCDCCouchDB = new AngularCloudDataConnector.couchDBDataService();
angular.module('AngularCDC.CouchDB', []).value('angularCDCCouchDB', angularCDCCouchDB);
