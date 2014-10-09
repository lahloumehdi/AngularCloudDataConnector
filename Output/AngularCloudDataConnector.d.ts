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
        static OnlineStatus : string;
        static LocalStatus : string;
        static NotDefinedStatus : string;
        public onlineStatus: string;
        public statusChangeFns: {
            (): void;
        }[];
        public addStatusChangeNotify(notifyFn: () => void): void;
        public getStatus(): string;
        private setStatus(value);
        private resetStatus();
        public isOnline(): boolean;
    }
}
declare var connectivityModule: ng.IModule;
declare module AngularCloudDataConnector {
    class DataService {
        public offlineService: OfflineService;
        public connectivityService: ConnectivityService;
        private _dataServices;
        private _db;
        private _lastSyncDates;
        private _scope;
        public onSync: (results: any) => void;
        private _pendingEntities;
        constructor(offlineService: OfflineService, connectivityService: ConnectivityService);
        public addSource(dataService: IDataService): void;
        public connect(onsuccess: () => void, scope?: any, version?: number): void;
        private _prepareAndClone(objectToClone, tableName, dataService);
        public sync(onsuccess: (result: any) => void): void;
        public syncDataService(dataService: IDataService, onsuccess: (result: any) => void): void;
        public tableCount : number;
        public forAllTables(action: (dataService: IDataService, tableName: string, callback: (result: any) => void) => void, onsuccess: (results: any[]) => void): void;
        public updateEntriesForTable(tableName: string, dataService: IDataService, firstCall: boolean, entities: IEntity[], onsuccess: (string: any) => void): void;
        public readAll(onsuccess: (result: any) => void): void;
        public getEntriesForServiceTable(dataService: IDataService, tableName: string, onsuccess: (result: any) => void): void;
        public processPendingEntities(onsuccess: (result: any) => void): void;
        public findDataService(tableName: string): IDataService;
        private _addProperty(objectToMark, prop, currentValue, controlledEntity);
        private _markItem(objectToMark, tableName, dataService);
        private isDirtyIncludingNewProperties(controller);
        public commit(onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        public rollback(onsuccess: (newEntity: any) => void): void;
        private _processFunction(tableName, entityOrArray, itemFunc);
        public add(tableName: string, entityOrArray: any): void;
        public remove(tableName: string, entityOrArray: any): void;
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
        dataService: IDataService;
        tableName: string;
        isNew: boolean;
        isDeleted: boolean;
        enumerablePropertyCount: number;
    }
}
declare module AngularCloudDataConnector {
    interface IDataService {
        _dataId: number;
        tableNames: string[];
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        get(updateCallback: (result: any) => void, lastSyncDates: {
            [tableName: string]: Date;
        }): void;
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
    }
}
declare module AngularCloudDataConnector.Internals {
    class InMemoryRequest {
        public result: InMemoryDatabase;
        public onerror: any;
        public onblocked: any;
        public onsuccess: any;
        public onupgradeneeded: any;
        constructor(result: InMemoryDatabase);
    }
    class InMemoryTransaction {
        public oncomplete: () => void;
        public onabort: () => void;
        private _db;
        constructor(db: InMemoryDatabase);
        public objectStore(name: string): InMemoryTransactionalObjectStore;
    }
    class InMemoryObjectStore {
        public keypath: string;
        public data: any[];
        constructor(keypath: string);
    }
    class InMemoryTransactionalObjectStore {
        public objectStore: InMemoryObjectStore;
        public transaction: InMemoryTransaction;
        constructor(objectStore: InMemoryObjectStore, transaction: InMemoryTransaction);
        public delete(idToDelete: string): void;
        public put(value: any): void;
        public openCursor(): InMemoryCursor;
        public clear(): void;
    }
    class InMemoryCursor {
        public objectStore: InMemoryObjectStore;
        public onsuccess: any;
        private _position;
        private _keys;
        public value : any;
        public continue(): void;
        constructor(objectStore: InMemoryObjectStore);
    }
    class InMemoryDatabase {
        public _objectStores: {};
        public open(name: string, version: number): InMemoryRequest;
        public createObjectStore(name: string, def: {
            keyPath: string;
        }): void;
        public transaction(name: string): InMemoryTransaction;
    }
}
interface Window {
    webkitIndexedDB: any;
    mozIndexedDB: any;
}
declare module AngularCloudDataConnector {
    class OfflineService {
        public _offlineIndex: number;
        public checkForPendingEntities(db: IDBDatabase, tableName: string, dataService: IDataService, onsuccess: () => void): void;
        public reset(): void;
        public processOfflineEntity(db: IDBDatabase, tableName: string, dataService: IDataService, order: string, entity: IEntity, onsuccess: () => void, onerror: (evt: any) => void): void;
    }
}
declare var dataModule: ng.IModule;
