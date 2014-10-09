/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

module AngularCloudDataConnector {

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!indexedDB) {
        console.log("IDB not supported. Offline mode Framework will not be available.");
    }

    export class DataService {
        private _dataServices = new Array<IDataService>();
        private _db: IDBDatabase;
        // On a per table basis we keep track of the latest date we got data.  Ideally the data set contains the ability to query from a given time
        // So _lastSyncDate[0]['tableName']returns date.
        private _lastSyncDates = new Array<{ [tableName: string]: Date; }>();
        private _scope: any; // Currently set scope

        public onSync: (results: any) => void;

        // Temp space
        private _pendingEntities = {};

        constructor(public offlineService: OfflineService, public connectivityService: ConnectivityService) {
        }

        public addSource(dataService: IDataService): void {
            if (dataService._dataId !== undefined) {
                return; // No need to register twice the same data service
            }
            dataService._dataId = this._dataServices.length;

            this._dataServices.push(dataService);

            var lastSyncDates: { [tableName: string]: Date; } = {};
            for (var i = 0; i < dataService.tableNames.length; i++) {
                lastSyncDates[dataService.tableNames[i]] = null;
            }
            this._lastSyncDates.push(lastSyncDates);
        }

        public connect(onsuccess: () => void, scope = null, version: number = 1): void {
            if (!indexedDB) {
                indexedDB = new Internals.InMemoryDatabase();
            }

            var request = indexedDB.open("syncbase", version);

            this._scope = scope;

            request.onerror = event => {
                console.log("IDB request error.", event.target.error.name);
            };

            // executes when a version change transaction cannot complete due to other active transactions
            request.onblocked = event => {
                console.log("IDB request blocked. Please reload the page.", event.target.error.name);
            };

            // DB has been opened successfully
            request.onsuccess = () => {
                console.log("DB successfully opened");
                this._db = request.result;

                // If online, check for pending orders
                if (this.connectivityService.isOnline()) {
                    this.processPendingEntities(onsuccess);
                }
                else {
                    this.sync(onsuccess);
                }

                // Offline support
                this.connectivityService.addStatusChangeNotify(() => {
                    if (this.connectivityService.isOnline()) {
                        this.processPendingEntities(onsuccess);
                    }
                    else {
                        this.offlineService.reset();
                    }
                });
            };

            // Initialization of the DB. Creating stores
            request.onupgradeneeded = event => {
                this._db = event.target.result;
                for (var i = 0; i < this._dataServices.length; i++) {
                    var dataService = this._dataServices[i];
                    for (var j = 0; j < dataService.tableNames.length; j++) {
                        var tableName = dataService.tableNames[j];
                        try {
                            this._db.createObjectStore(tableName + "LocalDB" + dataService._dataId, { keyPath: "id" });
                            this._db.createObjectStore(tableName + "OfflineDB" + dataService._dataId, { keyPath: "index" });
                            console.log("Created object store in DB for " + tableName);
                        } catch (ex) {
                            console.log("Error while creating object stores for " + tableName + " Exception: " + ex.message);
                        }
                    }
                }
            };
        }

        private _prepareAndClone(objectToClone: any, tableName: string, dataService: IDataService): any {
            var result = {};

            for (var prop in objectToClone) {
                result[prop] = objectToClone[prop];
            }

            this._markItem(result, tableName, dataService);

            return result;
        }

        // Sync callback gets an object where the keys on the object will be placed into the $scope of the controller.
        // The values associate the key are arrays that correspond to the "Tables" from various cloud databases.
        public sync(onsuccess: (result: any) => void): void {
            var count = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                this.syncDataService(this._dataServices[i], partialResult => {
                    var results = { tableName: partialResult.tableName, table: [] };

                    for (var index = 0; index < partialResult.table.length; index++) {
                        results.table.push(this._prepareAndClone(partialResult.table[index], partialResult.tableName, this._dataServices[count]));
                    }


                    if (this._scope) {
                        // Syncing the scope
                        if (this._scope.$apply) { // This is an angular scope
                            this._scope.$apply(this._scope[results.tableName] = results.table);
                        } else {
                            this._scope[results.tableName] = results.table;
                        }
                    }

                    // Calling onSuccess
                    if (onsuccess) {
                        onsuccess(results);
                    }

                    // Custom callback
                    if (this.onSync) {
                        this.onSync(results);
                    }
                });
            }
        }

        // onsuccess needs to be called with an object where the keys are the tablename and the values are the "tables"
        syncDataService(dataService: IDataService, onsuccess: (result: any) => void): void {
            if (this.connectivityService.isOnline()) {
                // Get the updated rows since last sync date
                dataService.get(tables => {
                    var tableCount = tables.length;

                    for (var i = 0; i < tableCount; i++) {
                        var tableName = tables[i].tableName;
                        var list = tables[i].table;
                        var lastSyncDate = this._lastSyncDates[dataService._dataId][tableName];
                        var firstCall = (lastSyncDate === null);

                        // get sync date and delete status
                        for (var index = 0; index < list.length; index++) {
                            var entity = list[index];
                            var updatedate = new Date(entity.sync_updated);
                            if (!lastSyncDate || updatedate > lastSyncDate) {
                                this._lastSyncDates[dataService._dataId][tableName] = updatedate;
                            }
                        }

                        this.updateEntriesForTable(tableName, dataService, firstCall, list, (currentTableName) => {
                            this.getEntriesForServiceTable(dataService, currentTableName, onsuccess);
                        });
                    }
                }, this._lastSyncDates[dataService._dataId]);
                return;
            }

            // Offline
            this.readAll(onsuccess);
        }


        public get tableCount(): number {
            var result = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                result += dataService.tableNames.length;
            }

            return result;
        }

        public forAllTables(action: (dataService: IDataService, tableName: string, callback: (result: any) => void) => void, onsuccess: (results: Array<any>) => void): void {
            var total = this.tableCount;
            var count = 0;
            var results = [];
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                for (var j = 0; j < dataService.tableNames.length; j++) {
                    var tableName = dataService.tableNames[j];
                    action(dataService, tableName, result => {
                        count++;
                        results.push(result);
                        if (count === total) {
                            onsuccess(results);
                        }
                    });
                }
            }
        }

        // this updates the values in the local index.db store - when it completes onsuccess is called with no value.
        public updateEntriesForTable(tableName: string, dataService: IDataService, firstCall: boolean, entities: Array<IEntity>, onsuccess: (string) => void): void {
            var dbName = tableName + "LocalDB" + dataService._dataId;
            var transaction = this._db.transaction([dbName], "readwrite");

            // the transaction could abort because of a QuotaExceededError error
            transaction.onabort = event => {
                console.log("Error with transaction", event.target.error.name);
            };

            transaction.oncomplete = () => {
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
        }

        // This gets all entries.  The callback onsuccess is called with an Object where the keys are the tableNames and the values are the tables.
        // Note that the arrays returned for the table are in memory copies of what is stored in the local database. 
        public readAll(onsuccess: (result: any) => void): void {

            this.forAllTables(
                // action
                (dataService, tableName, doNext) => {
                    this.getEntriesForServiceTable(dataService, tableName, doNext);
                },
                // Below is called with an array that this result passed to the onsuccess function for each table
                partialResultArray => {
                    var result = {};
                    for (var i = 0; i < partialResultArray.length; i++) {
                        result[partialResultArray[i].tableName] = partialResultArray[i].table;
                    }
                    if (onsuccess) {
                        onsuccess(result);
                    }
                });
        }

        // onsuccess is called with an Object where the key is the tableName and the value is the table.
        public getEntriesForServiceTable(dataService: IDataService, tableName: string, onsuccess: (result: any) => void): void {
            var dbName = tableName + "LocalDB" + dataService._dataId;
            var objectStore = this._db.transaction(dbName).objectStore(dbName);
            var resultTable = [];

            objectStore.openCursor().onsuccess = (event: any) => {
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

                        this[tableName] = resultTable;

                        onsuccess(result);
                    }
                }
            };
        }

        public processPendingEntities(onsuccess: (result: any) => void): void {
            var remainingTables = 0;
            for (var i = 0; i < this._dataServices.length; i++) {
                var dataService = this._dataServices[i];
                remainingTables += dataService.tableNames.length;
                for (var j = 0; j < dataService.tableNames.length; j++) {
                    var tableName = dataService.tableNames[j];
                    this.offlineService.checkForPendingEntities(this._db, tableName, dataService, () => {
                        remainingTables--;
                        if (remainingTables === 0) {
                            this.sync(onsuccess);
                        }
                    });
                }
            }
        }

        public findDataService(tableName: string): IDataService {
            var dataService = $.grep(this._dataServices, service => $.inArray(tableName, service.tableNames) != -1);
            if (dataService.length >= 0) {
                return dataService[0];
            }
            return null;
        }

        private _addProperty(objectToMark: any, prop: string, currentValue: any, controlledEntity: IControlledEntity): void {
            Object.defineProperty(objectToMark, prop, {
                get: () => currentValue,
                set: value => {
                    currentValue = value;
                    controlledEntity.isDirty = true;
                },
                enumerable: true,
                configurable: true
            });
        }

        private _markItem(objectToMark: any, tableName: string, dataService: IDataService): IControlledEntity {
            if (this._pendingEntities[tableName] && objectToMark._getControllerItem) {
                // Existing one
                var controlledEntity = objectToMark._getControllerItem();
                controlledEntity.isDirty = true;
            } else {
                // New one
                controlledEntity = {
                    isDirty: false,
                    dataService: dataService,
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

                objectToMark._getControllerItem = () => controlledEntity;
                count++;
                controlledEntity.enumerablePropertyCount = count;

                if (!this._pendingEntities[tableName]) {
                    this._pendingEntities[tableName] = new Array<IControlledEntity>();
                }

                this._pendingEntities[tableName].push(controlledEntity);
            }

            return controlledEntity;
        }

        private isDirtyIncludingNewProperties(controller: IControlledEntity): boolean {
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
        }

        public commit(onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var count = 0;
            // Counting dirty entities
            for (var tableName in this._pendingEntities) { // For each tablename
                for (var index in this._pendingEntities[tableName]) {
                    var entity = this._pendingEntities[tableName][index];
                    if (this.isDirtyIncludingNewProperties(entity)) {
                        count++;
                    }
                }
            }

            // onerror
            var processOnError = () => {
                if (!this.connectivityService.isOnline()) {
                    this.readAll(onerror);
                } else {
                    this.sync(onerror);
                }
            }

            // Processing orders
            for (tableName in this._pendingEntities) { // For each tablename
                for (index in this._pendingEntities[tableName]) {
                    entity = this._pendingEntities[tableName][index];

                    // No need to process if not dirty
                    if (!this.isDirtyIncludingNewProperties(entity)) {
                        continue;
                    }

                    var offlineOrder;
                    var onlineFunc;
                    if (entity.isNew) {                         // Add
                        offlineOrder = "put";
                        onlineFunc = entity.dataService.add;
                    } else if (entity.isDeleted) {              // Remove
                        offlineOrder = "delete";
                        onlineFunc = entity.dataService.remove;
                    } else {                                    // Update
                        offlineOrder = "put";
                        onlineFunc = entity.dataService.update;
                    }

                    // Resetting states
                    entity.isNew = false;
                    entity.isDirty = false;
                    entity.isDeleted = false;

                    // Sending orders
                    if (!this.connectivityService.isOnline()) { // Offline Mode
                        this.offlineService.processOfflineEntity(this._db, tableName, entity.dataService, offlineOrder, entity.entity, () => {
                            count--;

                            if (count === 0) {
                                this.readAll(onsuccess);
                            }
                        }, processOnError);
                        continue;
                    }

                    // Online mode
                    onlineFunc.call(entity.dataService, tableName, entity.entity, () => {
                        count--;

                        if (count === 0) { // All done
                            this.sync(onsuccess);
                        }
                    }, processOnError);

                    continue;

                }
            }
        }

        public rollback(onsuccess: (newEntity: any) => void) {
            // This is where the magic happens. We just need to clear the pendingEntities and ask for a sync

            this._pendingEntities = {};

            // Sync
            if (!this.connectivityService.isOnline()) {
                this.readAll(onsuccess);
                return;
            }

            this.sync(onsuccess);
        }

        private _processFunction(tableName: string, entityOrArray: any, itemFunc: (entity: any) => void): void {
            var dataService = this.findDataService(tableName);
            var entities = entityOrArray;
            if (!Array.isArray(entityOrArray)) {
                entities = (entityOrArray === null) ? [] : [entityOrArray];
            }

            for (var index = 0; index < entities.length; index++) {
                var entity = entities[index];
                var controlledItem = this._markItem(entity, tableName, dataService);
                itemFunc(controlledItem);


                if (this._scope) {
                    // Syncing the scope
                    if (controlledItem.isDeleted) {
                        var position = this._scope[tableName].indexOf(entity);

                        if (position > -1) {
                            this._scope[tableName].splice(position, 1);
                        }
                        continue;
                    }

                    if (controlledItem.isNew) {
                        this._scope[tableName].push(entity);
                        continue;
                    }
                }

            }

            if (this._scope && this._scope.$apply && !this._scope.$$phase) {
                this._scope.$apply();
            }
        }

        public add(tableName: string, entityOrArray: any): void {
            this._processFunction(tableName, entityOrArray, item => {
                item.isDirty = true;
                item.isNew = true;
            });
        }

        public remove(tableName: string, entityOrArray: any): void {
            this._processFunction(tableName, entityOrArray, item => {
                item.isDirty = true;
                item.isDeleted = true;
            });
        }
    }
}

// Angular
var dataModule = angular.module('DataModule', ['OfflineModule', 'ConnectivityModule']);

dataModule.factory('dataService', ['offlineService', 'connectivityService', (offlineService, connectivityService) => {
    return new AngularCloudDataConnector.DataService(offlineService, connectivityService);
}]);