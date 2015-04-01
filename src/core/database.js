/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
var CloudDataConnector;
(function (CloudDataConnector) {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!indexedDB) {
        console.log("IDB not supported. Offline mode Framework will not be available.");
    }

    var DataService = (function () {
        function DataService(angularCDCOfflineService, angularCDCConnectivityService) {
            this.angularCDCOfflineService = angularCDCOfflineService;
            this.angularCDCConnectivityService = angularCDCConnectivityService;
            this._dataServices = new Array();
            // On a per table basis we keep track of the latest date we got data.  Ideally the data set contains the ability to query from a given time
            // So _lastSyncDate[0]['tableName']returns date.
            this._lastSyncDates = new Array();
            // Temp space
            this._pendingEntities = {};
        }
        DataService.prototype.addSource = function (angularCDCService) {
            if (angularCDCService._dataId !== undefined) {
                return;
            }
            angularCDCService._dataId = this._dataServices.length;

            this._dataServices.push(angularCDCService);

            var lastSyncDates = {};
            for (var i = 0; i < angularCDCService.tableNames.length; i++) {
                lastSyncDates[angularCDCService.tableNames[i]] = null;
            }
            this._lastSyncDates.push(lastSyncDates);
        };

        DataService.prototype.connect = function (callback, objectStorage, objectStorageCallback, version) {
            var _this = this;
            if (typeof version === "undefined") { version = 1; }
            if (this._dataServices.length === 0) {
                throw "Initializing DataService is incomplete without first adding a provider via addSource";
                return;
            }

            if (!indexedDB) {
                indexedDB = new CloudDataConnector.Internals.InMemoryDatabase();
            }

            var request = indexedDB.open("syncbase", version);

            this._objectStorage = objectStorage;
            this._objectStorageCallback = objectStorageCallback;
            request.onerror = function (event) {
                if (callback)
                    callback(false);
                console.log("IDB request error.", event.target.error.name);
            };

            // executes when a version change transaction cannot complete due to other active transactions
            request.onblocked = function (event) {
                console.log("IDB request blocked. Please reload the page.", event.target.error.name);
            };

            // DB has been opened successfully
            request.onsuccess = function () {
                console.log("DB successfully opened");
                _this._db = request.result;

                // If online, check for pending orders
                if (_this.angularCDCConnectivityService.isOnline()) {
                    _this.processPendingEntities(callback);
                } else {
                    _this.sync(callback);
                }

                // Offline support
                _this.angularCDCConnectivityService.addStatusChangeNotify(function () {
                    if (_this.angularCDCConnectivityService.isOnline()) {
                        _this.processPendingEntities(callback);
                    } else {
                        _this.angularCDCOfflineService.reset();
                    }
                });
            };

            // Initialization of the DB. Creating stores
            request.onupgradeneeded = function (event) {
                _this._db = event.target.result;
                for (var i = 0; i < _this._dataServices.length; i++) {
                    var angularCDCService = _this._dataServices[i];
                    for (var j = 0; j < angularCDCService.tableNames.length; j++) {
                        var tableName = angularCDCService.tableNames[j];
                        try  {
                            _this._db.createObjectStore(tableName + "LocalDB" + angularCDCService._dataId, { keyPath: "id" });
                            _this._db.createObjectStore(tableName + "OfflineDB" + angularCDCService._dataId, { keyPath: "index" });
                            console.log("Created object store in DB for " + tableName);
                        } catch (ex) {
                            console.log("Error while creating object stores for " + tableName + " Exception: " + ex.message);
                        }
                    }
                }
            };
        };

        DataService.prototype._prepareAndClone = function (objectToClone, tableName, angularCDCService) {
            var result = {};

            for (var prop in objectToClone) {
                result[prop] = objectToClone[prop];
            }

            this._markItem(result, tableName, angularCDCService);

            return result;
        };

        // Sync callback gets an object where the keys on the object will be placed into the objectStorage of the controller.
        // The values associate the key are arrays that correspond to the "Tables" from various cloud databases.
        DataService.prototype.sync = function (callback) {
            var _this = this;
            var count = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                this.syncDataService(this._dataServices[i], function (partialResult) {
                    var results = { tableName: partialResult.tableName, table: [] };

                    for (var index = 0; index < partialResult.table.length; index++) {
                        results.table.push(_this._prepareAndClone(partialResult.table[index], partialResult.tableName, _this._dataServices[count]));
                    }

                    if (_this._objectStorage) {
                        // Syncing the scope
                        //if (this._scope.$apply) { // This is an angular scope
                        //    this._scope.$apply(this._scope[results.tableName] = results.table);
                        //} else {
                        if (_this._objectStorageCallback)
                            _this._objectStorageCallback(_this._objectStorage[results.tableName] = results.table);
                        else {
                            _this._objectStorage[results.tableName] = results.table;
                        }
                        //}
                    }

                    // Calling onSuccess
                    if (callback) {
                        callback(results);
                    }

                    // Custom callback
                    if (_this.onSync) {
                        _this.onSync(results);
                    }
                });
            }
        };

        // onsuccess needs to be called with an object where the keys are the tablename and the values are the "tables"
        DataService.prototype.syncDataService = function (angularCDCService, onsuccess) {
            var _this = this;
            if (this.angularCDCConnectivityService.isOnline()) {
                // Get the updated rows since last sync date
                angularCDCService.get(function (tables) {
                    var tableCount = tables.length;

                    for (var i = 0; i < tableCount; i++) {
                        var tableName = tables[i].tableName;
                        var list = tables[i].table;
                        var lastSyncDate = _this._lastSyncDates[angularCDCService._dataId][tableName];
                        var firstCall = (lastSyncDate === null);

                        for (var index = 0; index < list.length; index++) {
                            var entity = list[index];
                            var updatedate = new Date(entity.sync_updated);
                            if (!lastSyncDate || updatedate > lastSyncDate) {
                                _this._lastSyncDates[angularCDCService._dataId][tableName] = updatedate;
                            }
                        }

                        _this.updateEntriesForTable(tableName, angularCDCService, firstCall, list, function (currentTableName) {
                            _this.getEntriesForServiceTable(angularCDCService, currentTableName, onsuccess);
                        });
                    }
                }, this._lastSyncDates[angularCDCService._dataId]);
                return;
            }

            // Offline
            this.readAll(onsuccess);
        };

        Object.defineProperty(DataService.prototype, "tableCount", {
            get: function () {
                var result = 0;
                for (var i = 0; i < this._dataServices.length; i++) {
                    var angularCDCService = this._dataServices[i];
                    result += angularCDCService.tableNames.length;
                }

                return result;
            },
            enumerable: true,
            configurable: true
        });

        DataService.prototype.doThisForAllTables = function (action, onsuccess) {
            var total = this.tableCount;
            var count = 0;
            var results = [];
            for (var i = 0; i < this._dataServices.length; i++) {
                var angularCDCService = this._dataServices[i];
                for (var j = 0; j < angularCDCService.tableNames.length; j++) {
                    var tableName = angularCDCService.tableNames[j];
                    action(angularCDCService, tableName, function (result) {
                        count++;
                        results.push(result);
                        if (count === total) {
                            onsuccess(results);
                        }
                    });
                }
            }
        };

        // this updates the values in the local index.db store - when it completes onsuccess is called with no value.
        DataService.prototype.updateEntriesForTable = function (tableName, angularCDCService, firstCall, entities, onsuccess) {
            var dbName = tableName + "LocalDB" + angularCDCService._dataId;
            var transaction = this._db.transaction([dbName], "readwrite");

            // the transaction could abort because of a QuotaExceededError error
            transaction.onabort = function (event) {
                console.log("Error with transaction", (event).target.error.name);
            };

            transaction.oncomplete = function () {
                onsuccess(tableName);
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
                    if (entity.sync_deleted) {
                        store.delete(entity.id);
                    } else {
                        store.put(entity); // IDB will update or insert
                    }
                }
            }
        };

        // This gets all entries.  The callback onsuccess is called with an Object where the keys are the tableNames and the values are the tables.
        // Note that the arrays returned for the table are in memory copies of what is stored in the local database.
        DataService.prototype.readAll = function (onsuccess) {
            var _this = this;
            this.doThisForAllTables(// action
            function (angularCDCService, tableName, doNext) {
                _this.getEntriesForServiceTable(angularCDCService, tableName, doNext);
            }, function (partialResultArray) {
                var result = {};
                for (var i = 0; i < partialResultArray.length; i++) {
                    result[partialResultArray[i].tableName] = partialResultArray[i].table;
                }
                if (onsuccess) {
                    onsuccess(result);
                }
            });
        };

        // onsuccess is called with an Object where the key is the tableName and the value is the table.
        DataService.prototype.getEntriesForServiceTable = function (angularCDCService, tableName, onsuccess) {
            var _this = this;
            var dbName = tableName + "LocalDB" + angularCDCService._dataId;
            var storeObject = this._db.transaction(dbName).objectStore(dbName);
            var resultTable = [];

            storeObject.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    resultTable.push(cursor.value);
                    cursor.continue();
                } else {
                    if (onsuccess) {
                        var result = {
                            tableName: tableName,
                            table: resultTable,
                            angularCDCService: angularCDCService
                        };

                        _this[tableName] = resultTable;

                        onsuccess(result);
                    }
                }
            };
        };

        DataService.prototype.processPendingEntities = function (onsuccess) {
            var _this = this;
            var remainingTables = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                var angularCDCService = this._dataServices[i];
                remainingTables += angularCDCService.tableNames.length;
                for (var j = 0; j < angularCDCService.tableNames.length; j++) {
                    var tableName = angularCDCService.tableNames[j];
                    this.angularCDCOfflineService.checkForPendingEntities(this._db, tableName, angularCDCService, function () {
                        remainingTables--;
                        if (remainingTables === 0) {
                            _this.sync(onsuccess);
                        }
                    });
                }
            }
        };

        DataService.prototype.findDataService = function (tableName) {
            var angularCDCService = $.grep(this._dataServices, function (service) {
                return $.inArray(tableName, service.tableNames) != -1;
            });
            if (angularCDCService.length >= 0) {
                return angularCDCService[0];
            }
            return null;
        };

        DataService.prototype._addProperty = function (objectToMark, prop, currentValue, controlledEntity) {
            Object.defineProperty(objectToMark, prop, {
                get: function () {
                    return currentValue;
                },
                set: function (value) {
                    currentValue = value;
                    controlledEntity.isDirty = true;
                },
                enumerable: true,
                configurable: true
            });
        };

        DataService.prototype._markItem = function (objectToMark, tableName, angularCDCService) {
            if (this._pendingEntities[tableName] && objectToMark._getControllerItem) {
                // Existing one
                var controlledEntity = objectToMark._getControllerItem();
                controlledEntity.isDirty = true;
            } else {
                // New one
                controlledEntity = {
                    isDirty: false,
                    angularCDCService: angularCDCService,
                    tableName: tableName,
                    entity: objectToMark,
                    isNew: false,
                    isDeleted: false
                };

                // Add properties instead of direct access members
                var count = 0;
                for (var prop in objectToMark) {
                    count++;
                    var currentValue = objectToMark[prop];
                    this._addProperty(objectToMark, prop, currentValue, controlledEntity);
                }

                objectToMark._getControllerItem = function () {
                    return controlledEntity;
                };
                count++;
                controlledEntity.enumerablePropertyCount = count;

                if (!this._pendingEntities[tableName]) {
                    this._pendingEntities[tableName] = new Array();
                }

                this._pendingEntities[tableName].push(controlledEntity);
            }

            return controlledEntity;
        };

        DataService.prototype.isDirtyIncludingNewProperties = function (controller) {
            if (controller.isDirty) {
                return true;
            }

            var propertyCount = Object.keys(controller.entity).length;
            if (propertyCount != (controller.enumerablePropertyCount + 1)) {
                // the +1 comes from $$hashKey that Angular ng-repeat operations inject
                // Now mark missing properties
                var count = 0;
                for (var prop in controller.entity) {
                    if (prop[0] === "_" || prop[0] === "$") {
                        continue;
                    }
                    count++;
                    var currentValue = controller.entity[prop];
                    this._addProperty(controller.entity, prop, currentValue, controller);
                }

                controller.enumerablePropertyCount = count + 1;
                controller.isDirty = true; // and remember this is still dirty.
                return true;
            }
            return false;
        };

        DataService.prototype.commit = function (onsuccess, onerror) {
            var _this = this;
            var count = 0;

            for (var tableName in this._pendingEntities) {
                for (var index in this._pendingEntities[tableName]) {
                    var entity = this._pendingEntities[tableName][index];
                    if (this.isDirtyIncludingNewProperties(entity)) {
                        count++;
                    }
                }
            }

            // onerror
            var processOnError = function () {
                if (!_this.angularCDCConnectivityService.isOnline()) {
                    _this.readAll(onerror);
                } else {
                    _this.sync(onerror);
                }
            };

            for (tableName in this._pendingEntities) {
                for (index in this._pendingEntities[tableName]) {
                    entity = this._pendingEntities[tableName][index];

                    // No need to process if not dirty
                    if (!this.isDirtyIncludingNewProperties(entity)) {
                        continue;
                    }

                    var offlineOrder;
                    var onlineFunc;
                    if (entity.isNew) {
                        offlineOrder = "put";
                        onlineFunc = entity.angularCDCService.add;
                    } else if (entity.isDeleted) {
                        offlineOrder = "delete";
                        onlineFunc = entity.angularCDCService.remove;
                    } else {
                        offlineOrder = "put";
                        onlineFunc = entity.angularCDCService.update;
                    }

                    // Resetting states
                    entity.isNew = false;
                    entity.isDirty = false;
                    entity.isDeleted = false;

                    // Sending orders
                    if (!this.angularCDCConnectivityService.isOnline()) {
                        this.angularCDCOfflineService.processOfflineEntity(this._db, tableName, entity.angularCDCService, offlineOrder, entity.entity, function () {
                            count--;

                            if (count === 0) {
                                _this.readAll(onsuccess);
                            }
                        }, processOnError);
                        continue;
                    }

                    // Online mode
                    onlineFunc.call(entity.angularCDCService, tableName, entity.entity, function () {
                        count--;

                        if (count === 0) {
                            _this.sync(onsuccess);
                        }
                    }, processOnError);

                    continue;
                }
            }
        };

        DataService.prototype.rollback = function (onsuccess) {
            // This is where the magic happens. We just need to clear the pendingEntities and ask for a sync
            this._pendingEntities = {};

            // Sync
            if (!this.angularCDCConnectivityService.isOnline()) {
                this.readAll(onsuccess);
                return;
            }

            this.sync(onsuccess);
        };

        DataService.prototype._processFunction = function (tableName, entityOrArray, itemFunc) {
            var angularCDCService = this.findDataService(tableName);
            var entities = entityOrArray;
            if (!Array.isArray(entityOrArray)) {
                entities = (entityOrArray === null) ? [] : [entityOrArray];
            }

            for (var index = 0; index < entities.length; index++) {
                var entity = entities[index];
                var controlledItem = this._markItem(entity, tableName, angularCDCService);
                itemFunc(controlledItem);

                if (this._objectStorage) {
                    // Syncing the scope
                    if (controlledItem.isDeleted) {
                        var position = this._objectStorage[tableName].indexOf(entity);

                        if (position > -1) {
                            this._objectStorage[tableName].splice(position, 1);
                        }
                        continue;
                    }

                    if (controlledItem.isNew) {
                        this._objectStorage[tableName].push(entity);
                        continue;
                    }
                }
            }
            if (this._objectStorage && this._objectStorageCallback) {
                this._objectStorageCallback();
            }
            //if (this._scope && this._scope.$apply && !this._scope.$$phase) {
            //    this._scope.$apply();
            //}
        };

        DataService.prototype.add = function (tableName, entityOrArray) {
            this._processFunction(tableName, entityOrArray, function (item) {
                item.isDirty = true;
                item.isNew = true;
            });
        };

        DataService.prototype.remove = function (tableName, entityOrArray) {
            this._processFunction(tableName, entityOrArray, function (item) {
                item.isDirty = true;
                item.isDeleted = true;
            });
        };
        return DataService;
    })();
    CloudDataConnector.DataService = DataService;
})(CloudDataConnector || (CloudDataConnector = {}));
//# sourceMappingURL=database.js.map
