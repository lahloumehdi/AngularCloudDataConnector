/// <reference path="../lib/jquery/jquery.d.ts" />
/// <reference path="cdc.d.ts" />
declare var WindowsAzure: any;
declare module CloudDataConnector {
    class AzureDataService implements IDataService {
        azureClient: any;
        dataAvailableCallback: (any: any) => void;
        tableNames: string[];
        _dataId: number;
        _lastSyncDate: Date;
        addSource(urlOrClient: any, secretKey: string, tableNames: any): void;
        get(updateCallback: (result: any) => void, lastSyncDates: any): void;
        private _getTable(tableName, callback, lastDate);
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
    }
}
