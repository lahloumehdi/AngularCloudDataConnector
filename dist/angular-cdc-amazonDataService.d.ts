/// <reference path="../lib/angularjs/angular.d.ts" />
/// <reference path="../lib/jquery/jquery.d.ts" />
/// <reference path="angular-cdc.d.ts" />
declare var AWS: any;
declare module AngularCloudDataConnector {
    class AWSDataService implements IDataService {
        AWSClient: any;
        dataAvailableCallback: (any: any) => void;
        private deletedItem;
        tableNames: string[];
        _dataId: number;
        _lastSyncDate: Date;
        initSource(AccountId: string, RoleArn: string, idPool: any, region: string, tableNames: any): void;
        get(updateCallback: (result: any) => void, lastSyncDates: any): void;
        private _getTable(tableName, callback, lastDate);
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
    }
}
declare var angularCDCAWS: AngularCloudDataConnector.AWSDataService;
