/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

var dataModule = angular.module('DataModule', ['OfflineModule', 'ConnectivityModule']);

dataModule.factory('dataService', function (offlineService, connectivityService) {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        if (!indexedDB) {
            console.log("IDB not supported. Angular Offline Data Framework will not be available.");
        }

        return {
        _dataServices: [],
        db: null,

        addSource: function (dataService) {
            if (dataService._dataId !== undefined) {
                return; // No need to register twice the same data service
            }

            dataService._lastSyncDate = null;
            dataService._dataId = this._dataServices.length;

            this._dataServices.push(dataService);
        },

        connect: function (onsuccess) {
            var that = this;
            var request = indexedDB.open("syncbase", 1.0);

            request.onerror = function (event) {
                console.log("IDB request error.", event.target.error.name);
            };

            // executes when a version change transaction cannot complete due to other active transactions
            request.onblocked = function (event) {
                console.log("IDB request blocked. Please reload the page.", event.target.error.name);
            };

            // DB has been opened successfully
            request.onsuccess = function () {
                console.log("DB successfully opened");
                that.db = request.result;

                // If online, check for pending orders
                if (connectivityService.isOnline()) {
                    that.sync(onsuccess);
                    that.processPendingEntities(onsuccess);
                } 
                else {
                    that.sync(onsuccess);
                }
            };

            // Initialization of the DB. Creating stores
            request.onupgradeneeded = function (event) {
                that.db = event.target.result;
                for (var i = 0; i < that._dataServices.length; i++) {
                    var dataService = that._dataServices[i];
                    for (var j = 0; j < dataService.tableNames.length; j++) {
                        var tableName = dataService.tableNames[j];
                        try {
                            that.db.createObjectStore(tableName + "LocalDB" + dataService._dataId, { keyPath: "id" });
                            that.db.createObjectStore(tableName + "OfflineDB" + dataService._dataId, { keyPath: "index" });
                            console.log("Created object store in DB for " + tableName);
                        } catch (ex) {
                            console.log("Error while creating object stores for " + tableName + " Exception: " + ex.message);
                        }
                    }
                }
            };

            // Offline support
            connectivityService.addStatusChangeNotify(function () {
                if (connectivityService.isOnline()) {
                    that.processPendingEntities(onsuccess);
                }
                else {
                    offlineService.reset();
                }
            });
        },

        // Sync callback gets an object where the keys on the object will be placed into the $scope of the controller.
        // The values associate the key are arrays that correspond to the "Tables" from various cloud databases.

        sync: function (onsuccess) {
            var result = {};
            var count = 0;
            var that = this;
            for (var i = 0; i < this._dataServices.length; i++) {
                this.syncDataService(this._dataServices[i], function (partialResult) {
                    for (key in partialResult) {
                        result[key] = partialResult[key];
                    }
                    count++;
                    if (count == that._dataServices.length) {
                        onsuccess(result);
                    }
                });
            }
        },

        _continueGetEntitiesForTable: function (that, dataService, tableName, callback) {
            return function () {
                that.getEntriesForServiceTable(dataService, tableName, callback);
            };
        },

        // onsuccess needs to be called with an object where the keys are the tablename and the values are the "tables"
        syncDataService: function (dataService, onsuccess) {
            if (connectivityService.isOnline()) {
                var that = this;
                var result = {};
                // Get the updated rows since last sync date
                dataService.get(function (tables) {
                    var tablesDone = 0;
                    var tableCount = tables.length;
                    var firstCall = (dataService._lastSyncDate === null);

                    for (var i = 0; i < tableCount; i++) {
                        var tableName = tables[i].tableName;
                        var list = tables[i].table;

                        // get sync date and delete status
                        for (var index = 0; index < list.length; index++) {
                            var entity = list[index];
                            var updatedate = new Date(entity.updateDate);
                            if (!dataService._lastSyncDate || updatedate > dataService._lastSyncDate) {
                                dataService._lastSyncDate = updatedate;
                            }
                        }

                        that.updateEntriesForTable(tableName, dataService, firstCall, list,
                            that._continueGetEntitiesForTable(that, dataService, tableName, function (partialResult) {
                                result[partialResult.tableName] = partialResult.table;
                                tablesDone++;
                                if (tablesDone == tableCount) {
                                    onsuccess(result);
                                }
                            }));
                    }
                }, dataService._lastSyncDate);
                return;
            }

            // Offline
            this.getEntries(onsuccess);
        },


        tableCount: function () {
            var result = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                result += dataService.tableNames.length;
            }

            return result;
        },

        forAllTables: function (action, onSuccess) {
            var total = this.tableCount();
            var count = 0;
            var results = [];
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                for (var j = 0; j < dataService.tableNames.length; j++) {
                    var tableName = dataService.tableNames[j];
                    action(dataService, tableName, function (result) {
                        count++;
                        results.push(result);
                        if (count == total) {
                            onSuccess(results);
                        }
                    });
                }
            }
        },

        // this updates the values in the local index.db store - when it completes onsuccess is called with no value.
        updateEntriesForTable: function (tableName, dataService, firstCall, entities, onsuccess) {
            var dbName = tableName + "LocalDB" + dataService._dataId;
            var transaction = this.db.transaction([dbName], "readwrite");

            // the transaction could abort because of a QuotaExceededError error
            transaction.onabort = function (event) {
                console.log("Error with transaction", event.target.error.name);
            };

            transaction.oncomplete = function () {
                onsuccess();
            };

            var store = transaction.objectStore(dbName);

            if (firstCall) {
                store.clear(); // Start with a fresh empty store
            }

            for (var index = 0; index < entities.length; index++) {
                var entity = entities[index];

                if (firstCall) {
                    store.put(entity); // Inject all on first call
                } else {
                    if (entity.deleted) {
                        store.delete(entity.id);
                    } else {
                        store.put(entity); // IDB will update or insert
                    }
                }
            }
        },

        // This gets all entries.  The callback onsuccess is called with an Object where the keys are the tableNames and the values are the tables.
        // Note that the arrays returned for the table are in memory copies of what is stored in the local database. 
        getEntries: function (onsuccess) {
            var total = this.tableCount();
            var count = 0;
            var result = {};
            var that = this;
            this.forAllTables(
                // action
                function (dataService, tableName, doNext) {
                    that.getEntriesForServiceTable(dataService, tableName, doNext);
                },
                // Below is called with an array that this result passed to the onsuccess function for each table
                function (partialResultArray) {
                    for (var i = 0; i < partialResultArray.length; i++) {
                        result[partialResultArray[i].tableName] = partialResultArray[i].table;
                    }
                    count += partialResultArray.length;
                    if (count == total) {
                        onsuccess(result);
                    }
                });
        },

        // onsuccess is called with an Object where the key is the tableName and the value is the table.
        getEntriesForServiceTable: function (dataService, tableName, onsuccess) {
            var dbName = tableName + "LocalDB" + dataService._dataId;
            var objectStore = this.db.transaction(dbName).objectStore(dbName);
            var resultTable = [];
            var that = this;

            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    resultTable.push(cursor.value);
                    cursor.continue();
                }
                else {
                    if (onsuccess) {
                        var result = {
                            tableName: tableName,
                            table: resultTable,
                            dataService: dataService
                        };

                        that[tableName] = resultTable;

                        onsuccess(result);
                    }
                }
            };
        },

        processPendingEntities: function (onsuccess) {
            var that = this;
            var remainingTables = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                remainingTables += dataService.tableNames.length;
                for (var j = 0; j < dataService.tableNames.length; j++) {
                    var tableName = dataService.tableNames[j];
                    offlineService.checkForPendingEntities(this.db, tableName, dataService, function () {
                        remainingTables--;
                        if (remainingTables == 0) {
                            that.sync(onsuccess);
                        }
                    });
                }
            }
        },

        findDataService: function (tableName) {
            var dataService = $.grep(this._dataServices, function (service) {
                return $.inArray(tableName, service.tableNames) != -1;
            });
            if (dataService.length >= 0) {
                return dataService[0];
            }
            return null;
        },

        add: function (tableName, entity, onsuccess, onerror) {
            var dataService = this.findDataService(tableName);
            var that = this;

            if (!connectivityService.isOnline()) { // Offline Mode
                offlineService.processOfflineEntity(this.db, tableName, dataService, "put", entity, function () {
                    that.getEntries(onsuccess);
                }, onerror);
                return;
            }

            // Online mode
            dataService.add(tableName, entity, function () {
                that.sync(onsuccess);
            }, onerror);
        },

        remove: function (tableName, entity, onsuccess, onerror) {
            var dataService = this.findDataService(tableName);
            var that = this;

            if (!connectivityService.isOnline()) { // Offline Mode
                offlineService.processOfflineEntity(this.db, tableName, dataService, "delete", entity, function () {
                    that.getEntries(onsuccess);
                }, onerror);
                return;
            }

            // Online mode
            dataService.remove(tableName, entity, function () {
                that.sync(onsuccess);
            }, onerror);
        },
    };
}

)