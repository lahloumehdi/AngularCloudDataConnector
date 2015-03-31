/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />

module AngularCloudDataConnector {

    export class RestfulDataService implements IDataService {
        _dataId: number;
        servicePath: string;
        tableNames: Array<string>;
        keyNames: any;
        $: JQuery;
        public initSource(servicePath, accessPaths: any) {

            //TODO: Implement OAuth
            //restSvc.config.credentials = undefined;

            if (servicePath.substring(servicePath.length - 1) !== "/") {
                servicePath += "/";
            }
            this.servicePath = servicePath;
            this.tableNames = new Array<string>();
            this.keyNames = {};
            $.each(accessPaths,(i, path) => {
                if (path.objectName.substring(0, 1) === "/") {
                    path.objectName = path.substring(1);
                }
                this.tableNames.push(path.objectName);
                this.keyNames[path.objectName] = path.keyProperyName;
            });
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {

            delete entity.$$hashKey;
            $.ajax({
                type: "POST",
                url: this.servicePath + tableName,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true,
                data: JSON.stringify(entity)
            }).done(() => {
                onsuccess(entity);
            }).fail(() => {
                onerror("http error");
            });
        }
        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {

            delete entity.$$hashKey;
            var eid = entity.id;
            if (this.keyNames[tableName] !== "id")
                delete entity.id;

            $.ajax({
                type: "PUT",
                url: this.servicePath + tableName + "/" + eid,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true,
                data: JSON.stringify(entity)
            }).done(() => {
                onsuccess(entity);
            }).fail(() => {
                onerror("update data failed");
            });
        }
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {

            $.ajax({
                type: "DELETE",
                url: this.servicePath + tableName + "/" + entity.id,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true
            }).done((result) => {
                onsuccess();
            }).fail(() => {
                onerror("delete object failed.");
            });
        }
        get(updateCallback: (result: any) => void, lastSyncDates: { [tableName: string]: Date; }): void {
            $.each(this.tableNames,(i, table) => {
                var lastSyncDate = lastSyncDates[table];

                this._getTable(table,(resultElement) => {
                    updateCallback([resultElement]);
                }, lastSyncDate);
            });
        }
        private _getTable(tableName: string, callback: (result: any) => void, lastDate: Date): void {
            
            $.ajax({
                type: "GET",
                url: this.servicePath + tableName,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true
            }).done((result) => {
                for (var i = 0; i < result.length; i++) {
                    // id must needed for Index DB.
                    // most C# cases, id stored as "Id"
                    if (result[i].id == undefined)
                        result[i].id = result[i][this.keyNames[tableName]];
                }
                var rs = { 'tableName': tableName, 'table': result };
                callback(rs);
            }).fail(() => {
                console.log("get data failed.");
            });
        }
    }
}

var angularCDCRest = new AngularCloudDataConnector.RestfulDataService();
angular.module('AngularCDC.RestWebServices', []).value('angularCDCRestWebServices', angularCDCRest);