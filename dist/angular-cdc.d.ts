/// <reference path="../lib/angularjs/angular.d.ts" />
/// <reference path="../lib/jquery/jquery.d.ts" />
declare module AngularCloudDataConnector {
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
declare module AngularCloudDataConnector {
    interface ICommand {
        entity: IEntity;
        tableName: string;
        order: string;
    }
}
declare module AngularCloudDataConnector {
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
declare var connectivityModule: ng.IModule;
declare module AngularCloudDataConnector {
    class DataService {
        angularCDCOfflineService: OfflineService;
        angularCDCConnectivityService: ConnectivityService;
        private _dataServices;
        private _db;
        private _lastSyncDates;
        private _scope;
        onSync: (results: any) => void;
        private _pendingEntities;
        constructor(angularCDCOfflineService: OfflineService, angularCDCConnectivityService: ConnectivityService);
        addSource(angularCDCService: IDataService): void;
        connect(onsuccess: () => void, scope?: any, version?: number): void;
        private _prepareAndClone(objectToClone, tableName, angularCDCService);
        sync(onsuccess: (result: any) => void): void;
        syncDataService(angularCDCService: IDataService, onsuccess: (result: any) => void): void;
        tableCount: number;
        forAllTables(action: (angularCDCService: IDataService, tableName: string, callback: (result: any) => void) => void, onsuccess: (results: any[]) => void): void;
        updateEntriesForTable(tableName: string, angularCDCService: IDataService, firstCall: boolean, entities: IEntity[], onsuccess: (string: any) => void): void;
        readAll(onsuccess: (result: any) => void): void;
        getEntriesForServiceTable(angularCDCService: IDataService, tableName: string, onsuccess: (result: any) => void): void;
        processPendingEntities(onsuccess: (result: any) => void): void;
        findDataService(tableName: string): IDataService;
        private _addProperty(objectToMark, prop, currentValue, controlledEntity);
        private _markItem(objectToMark, tableName, angularCDCService);
        private isDirtyIncludingNewProperties(controller);
        commit(onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        rollback(onsuccess: (newEntity: any) => void): void;
        private _processFunction(tableName, entityOrArray, itemFunc);
        add(tableName: string, entityOrArray: any): void;
        remove(tableName: string, entityOrArray: any): void;
    }
}
declare var dataModule: ng.IModule;
declare module AngularCloudDataConnector {
    interface IEntity {
        id: string;
        sync_deleted: boolean;
        sync_updated: Date;
    }
    interface IControlledEntity {
        entity: IEntity;
        isDirty: boolean;
        angularCDCService: IDataService;
        tableName: string;
        isNew: boolean;
        isDeleted: boolean;
        enumerablePropertyCount: number;
    }
}
declare module AngularCloudDataConnector.Internals {
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
        objectStore(name: string): InMemoryTransactionalObjectStore;
    }
    class InMemoryObjectStore {
        keypath: string;
        data: any[];
        constructor(keypath: string);
    }
    class InMemoryTransactionalObjectStore {
        objectStore: InMemoryObjectStore;
        transaction: InMemoryTransaction;
        constructor(objectStore: InMemoryObjectStore, transaction: InMemoryTransaction);
        delete(idToDelete: string): void;
        put(value: any): void;
        openCursor(): InMemoryCursor;
        clear(): void;
    }
    class InMemoryCursor {
        objectStore: InMemoryObjectStore;
        onsuccess: any;
        private _position;
        private _keys;
        value: any;
        continue(): void;
        constructor(objectStore: InMemoryObjectStore);
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
declare module AngularCloudDataConnector {
    class OfflineService {
        _offlineIndex: number;
        checkForPendingEntities(db: IDBDatabase, tableName: string, angularCDCService: IDataService, onsuccess: () => void): void;
        reset(): void;
        processOfflineEntity(db: IDBDatabase, tableName: string, angularCDCService: IDataService, order: string, entity: IEntity, onsuccess: () => void, onerror: (evt: any) => void): void;
    }
}
declare var dataModule: ng.IModule;
