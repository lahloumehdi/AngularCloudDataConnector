/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />
var CloudDataConnector;
(function (CloudDataConnector) {
    var couchDBDataService = (function () {
        function couchDBDataService() {
            this.tableNames = new Array();
        }
        couchDBDataService.prototype.initSource = function (urlPrefix, tableNames) {
            $.couch.urlPrefix = urlPrefix;
            this.tableNames = tableNames;
        };

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        couchDBDataService.prototype.get = function (updateCallback, lastSyncDates) {
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
        };

        couchDBDataService.prototype._getTable = function (tableName, callback, lastDate) {
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
                    });
                },
                error: function (e) {
                    callback({ 'tableName': tableName, 'table': [] });
                }
            });
        };

        couchDBDataService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            $.couch.db(tableName).removeDoc({ _id: entity._id, _rev: entity._rev })({
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        };

        couchDBDataService.prototype.update = function (tableName, entity, onsuccess, onerror) {
            $.couch.db(tableName).saveDoc(entity, {
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        };

        couchDBDataService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            $.couch.db(tableName).saveDoc(entity, {
                success: function (data) {
                    onsuccess(data);
                },
                error: function (e) {
                    onerror(e);
                }
            });
        };
        return couchDBDataService;
    })();
    CloudDataConnector.couchDBDataService = couchDBDataService;
})(CloudDataConnector || (CloudDataConnector = {}));
//# sourceMappingURL=couchDb.js.map
