/// <reference path="../../lib/jquery/jquery.d.ts" />
/// <reference path="../cdc.d.ts" />
/// <reference path="../../lib/angularjs/angular.d.ts" />
declare var CryptoJS: any;
declare class AzureStorageTableApi {
    private secretKey;
    private accountName;
    constructor(secretKey: string, accountName: string);
    private getSignature(stringToSign);
    private setHeaders(path);
    private performRequest(request, callback, error);
    getTable(tableName: string, callback: (result: any) => void): void;
    getListItemsInTable(tableName: string, partitionKey: string, callback: (result: any) => void): void;
    insertEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
    updateEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
    deleteEntity(tableName: string, entity: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
}
declare module CloudDataConnector {
    class AzureTableStorageService implements IDataService {
        azureClient: AzureStorageTableApi;
        dataAvailableCallback: (any: any) => void;
        tableNames: string[];
        _dataId: number;
        _lastSyncDate: Date;
        addSource(accountName: any, secretKey: string, tableNames: any): void;
        get(updateCallback: (result: any) => void, lastSyncDates: any): void;
        private _getTable(tableName, callback, lastDate);
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
    }
}
declare var angularCDCAzureTableStorageServices: CloudDataConnector.AzureTableStorageService;
