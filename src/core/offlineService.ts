/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />

module CloudDataConnector {
    export class OfflineService {
        _offlineIndex = 0;

        // Check for pending commands generated when offline
        public checkForPendingEntities(db: IDBDatabase, tableName: string, angularCDCService: IDataService, onsuccess: () => void): void {
            var dbName = tableName + "OfflineDB" + angularCDCService._dataId;
            var objectStore = db.transaction(dbName).objectStore(dbName);
            var commands = new Array<ICommand>();

            var deleteCommand = (command, then) => {
                var transaction = db.transaction(dbName, "readwrite");

                transaction.oncomplete = () => {
                    console.log("Command " + command.order + " for " + command.entity.id + " was played");
                    then();
                };

                transaction.onabort = () => {
                    console.log("Unable to remove offline command");
                };

                objectStore = transaction.objectStore(dbName);
                objectStore.delete(command.index);
            };

            var processCommand = (index: number) => {
                if (index >= commands.length) {
                    if (onsuccess) {
                        onsuccess();
                    }
                    return;
                }

                var command = commands[index];
                var entity = command.entity;
                var currentTableName = command.tableName;

                try {

                    switch (command.order) {
                        case "put":
                            var localId = entity.id;
                            delete entity.id; // Let data provider generate the ID for us
                            angularCDCService.add(currentTableName, entity, newEntity => {
                                // Fixing id for subsequent delete or update commands
                                for (var i = 0; i < commands.length; i++) {
                                    if (commands[i].entity.id === localId) {
                                        commands[i].entity.id = newEntity.id;
                                    }
                                }

                                // Deleting command
                                deleteCommand(command, () => {
                                    processCommand(index + 1);
                                });
                            }, err => {
                                    processCommand(index + 1);
                                });
                            break;
                        case "delete":
                            angularCDCService.remove(currentTableName, entity, () => {
                                deleteCommand(command, () => {
                                    processCommand(index + 1);
                                });
                            }, err => {
                                    processCommand(index + 1);
                                });
                            break;
                    }
                } catch (ex) {
                    console.log("Error processing pending entity for " + currentTableName + ". Exception: " + ex.message);
                    processCommand(index + 1);
                }

            }

            // Get commands
            objectStore.openCursor().onsuccess = (event: any) => {
                var cursor = event.target.result;
                if (cursor) {
                    commands.push(cursor.value);
                    cursor.continue();
                }
                else {
                    processCommand(0);
                }
            };
        }

        public reset(): void {
            this._offlineIndex = 0;
        }

        // Generate offline commands
        public processOfflineEntity(db: IDBDatabase, tableName: string, angularCDCService: IDataService, order: string, entity: IEntity, onsuccess: () => void, onerror: (evt: any) => void): void {
            var dbNameLocal = tableName + "LocalDB" + angularCDCService._dataId;
            var dbNameOffline = tableName + "OfflineDB" + angularCDCService._dataId;
            var transaction = db.transaction([dbNameLocal, dbNameOffline], "readwrite");

            transaction.onabort = event => {
                onerror(event);
            };

            transaction.oncomplete = () => {
                onsuccess();
            };

            var storeLocal = transaction.objectStore(dbNameLocal);
            var storeOffline = transaction.objectStore(dbNameOffline);

            if (this._offlineIndex === 0) {
                storeOffline.clear();
            }

            switch (order) {
                case "put":
                    entity.id = this._offlineIndex.toString();
                    storeLocal.put(entity);
                    break;
                case "delete":
                    storeLocal.delete(entity.id);
                    break;
            }
            storeOffline.put({
                index: this._offlineIndex.toString(),
                order: order,
                tableName: tableName,
                entity: entity
            });

            this._offlineIndex++;
        }
    }
}

