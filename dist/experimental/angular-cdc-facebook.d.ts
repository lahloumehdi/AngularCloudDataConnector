/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
/// <reference path="../cdc.d.ts" />
declare var WindowsAzure: any;
declare module AngularCloudDataConnector {
    interface TableNameAndPath {
        tableName: string;
        path: string;
    }
    class FacebookDataService implements IDataService {
        private facebookClient;
        private azureClient;
        tableNames: string[];
        tableToPath: any;
        _dataId: number;
        _lastSyncDate: Date;
        loggedIn: any;
        constructor(facebook: any);
        facebookResponse: any;
        ensureLogin(onsuccess: () => void): void;
        login(onsuccess: () => void): void;
        api(path: string, callback: (response: Object) => void): void;
        addSource(tableNamesAndPaths: TableNameAndPath[]): void;
        get(callback: (result: any) => void, lastSyncDates: {
            [x: string]: Date;
        }): void;
        private _getTable(tableName, callback, lastDate);
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
    }
}
declare var facebookDataModule: ng.IModule;
