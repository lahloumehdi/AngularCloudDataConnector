/// <reference path="../lib/angularjs/angular.d.ts" />
/// <reference path="../lib/jquery/jquery.d.ts" />
declare module CloudDataConnector {
    interface IDataService {
        _dataId: number;
        tableNames: string[];
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        get(updateCallback: (result: any) => void, lastSyncDates: {
            [x: string]: Date;
        }): void;
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
    }
}
declare module CloudDataConnector {
    interface ICommand {
        entity: IEntity;
        tableName: string;
        order: string;
    }
}
declare var __global: any;
declare module CloudDataConnector {
    class ConnectivityService {
        private static _NotDefinedStatus;
        private static _OnlineStatus;
        private static _LocalStatus;
        static OnlineStatus: string;
        static LocalStatus: string;
        static NotDefinedStatus: string;
        onlineStatus: string;
        statusChangeFns: {
            (): void;
        }[];
        addStatusChangeNotify(notifyFn: () => void): void;
        getStatus(): string;
        private setStatus(value);
        private resetStatus();
        isOnline(): boolean;
    }
}
declare var __global: any;
declare var sqlite3: any;
declare var indexeddbjs: any;
declare module CloudDataConnector {
    class DataService {
        CDCOfflineService: OfflineService;
        CDCConnectivityService: ConnectivityService;
        private _dataServices;
        private _db;
        private _lastSyncDates;
        private _objectStorage;
        private _objectStorageCallback;
        onSync: (results: any) => void;
        private _pendingEntities;
        constructor(CDCOfflineService: OfflineService, CDCConnectivityService: ConnectivityService);
        addSource(CDCService: IDataService): void;
        connect(callback: (any: any) => void, objectStorage: any, objectStorageCallback: (result: any) => void, version?: number): void;
        private _prepareAndClone(objectToClone, tableName, CDCService);
        sync(callback: (result: any) => void): void;
        syncDataService(CDCService: IDataService, onsuccess: (result: any) => void): void;
        tableCount: number;
        doThisForAllTables(action: (CDCService: IDataService, tableName: string, callback: (result: any) => void) => void, onsuccess: (results: any[]) => void): void;
        updateEntriesForTable(tableName: string, CDCService: IDataService, firstCall: boolean, entities: IEntity[], onsuccess: (string: any) => void): void;
        readAll(onsuccess: (result: any) => void): void;
        getEntriesForServiceTable(CDCService: IDataService, tableName: string, onsuccess: (result: any) => void): void;
        processPendingEntities(onsuccess: (result: any) => void): void;
        private inArray(elem, array, i?);
        private grep(elems, callback, invert?);
        findDataService(tableName: string): IDataService;
        private _addProperty(objectToMark, prop, currentValue, controlledEntity);
        private _markItem(objectToMark, tableName, CDCService);
        private isDirtyIncludingNewProperties(controller);
        commit(onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        rollback(onsuccess: (newEntity: any) => void): void;
        private _processFunction(tableName, entityOrArray, itemFunc);
        add(tableName: string, entityOrArray: any): void;
        remove(tableName: string, entityOrArray: any): void;
    }
}
declare module CloudDataConnector {
    interface IEntity {
        id: string;
        sync_deleted: boolean;
        sync_updated: Date;
    }
    interface IControlledEntity {
        entity: IEntity;
        isDirty: boolean;
        CDCService: IDataService;
        tableName: string;
        isNew: boolean;
        isDeleted: boolean;
        enumerablePropertyCount: number;
    }
}
declare module CloudDataConnector.Internals {
    class InMemoryRequest {
        result: InMemoryDatabase;
        onerror: any;
        onblocked: any;
        onsuccess: any;
        onupgradeneeded: any;
        constructor(result: InMemoryDatabase);
    }
    class InMemoryTransaction {
        oncomplete: () => void;
        onabort: () => void;
        private _db;
        constructor(db: InMemoryDatabase);
        objectStore(name: string): InMemoryTransactionalStoreObject;
    }
    class InMemoryStoreObject {
        keypath: string;
        data: any[];
        constructor(keypath: string);
    }
    class InMemoryTransactionalStoreObject {
        objectStore: InMemoryStoreObject;
        transaction: InMemoryTransaction;
        constructor(objectStore: InMemoryStoreObject, transaction: InMemoryTransaction);
        delete(idToDelete: string): void;
        put(value: any): void;
        openCursor(): InMemoryCursor;
        clear(): void;
    }
    class InMemoryCursor {
        objectStore: InMemoryStoreObject;
        onsuccess: any;
        private _position;
        private _keys;
        value: any;
        continue(): void;
        constructor(objectStore: InMemoryStoreObject);
    }
    class InMemoryDatabase {
        _objectStores: {};
        open(name: string, version: number): InMemoryRequest;
        createObjectStore(name: string, def: {
            keyPath: string;
        }): void;
        transaction(name: string): InMemoryTransaction;
    }
}
interface Window {
    webkitIndexedDB: any;
    mozIndexedDB: any;
}
declare module CloudDataConnector {
    class OfflineService {
        _offlineIndex: number;
        checkForPendingEntities(db: IDBDatabase, tableName: string, CDCService: IDataService, onsuccess: () => void): void;
        reset(): void;
        processOfflineEntity(db: IDBDatabase, tableName: string, CDCService: IDataService, order: string, entity: IEntity, onsuccess: () => void, onerror: (evt: any) => void): void;
    }
}
