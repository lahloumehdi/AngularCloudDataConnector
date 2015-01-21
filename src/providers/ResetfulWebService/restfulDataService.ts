

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/angular-cdc.d.ts" />

declare var restSvc;

module AngularCloudDataConnector {
    export class RestfulDataService implements IDataService {
        _dataId: number;
        tableNames: Array<string>;
        $: JQuery;
        public initSource(accessPaths) {

            //TODO: Implement OAuth
            //restSvc.config.credentials = undefined;

            this.tableNames = accessPaths;
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            
        }
        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            
        }
        get(updateCallback: (result: any) => void, lastSyncDates: { [tableName: string]: Date; }): void  {
            
        }
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            
        }
    }
} 