

module AngularCloudDataConnector {
    export class RestfulDataService implements IDataService {
        _dataId: number;
        tableNames: Array<string>;


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