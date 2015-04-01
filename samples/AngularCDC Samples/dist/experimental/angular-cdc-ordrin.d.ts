/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
/// <reference path="../angular-cdc.d.ts" />
declare module CloudDataConnector {
    class OrdrinService implements IDataService {
        tableNames: string[];
        _dataId: number;
        _lastSyncDate: Date;
        private _serviceUrl;
        private _http;
        private _zip;
        private _city;
        private _address;
        private _result;
        constructor(http: any);
        Zip: string;
        City: string;
        Address: string;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        get(callback: (result: any) => void, lastSyncDates: {
            [x: string]: Date;
        }): void;
        update(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
    }
}
