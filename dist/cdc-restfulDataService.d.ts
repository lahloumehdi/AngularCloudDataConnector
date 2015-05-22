/// <reference path="../lib/jquery/jquery.d.ts" />
/// <reference path="cdc.d.ts" />
declare module CloudDataConnector {
    class RestfulDataService implements IDataService {
        _dataId: number;
        servicePath: string;
        tableNames: string[];
        keyNames: any;
        $: JQuery;
        initSource(servicePath: any, accessPaths: any): void;
        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        get(updateCallback: (result: any) => void, lastSyncDates: {
            [x: string]: Date;
        }): void;
        private _getTable(tableName, callback, lastDate);
    }
}
