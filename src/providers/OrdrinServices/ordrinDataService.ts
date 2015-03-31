/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />

module AngularCloudDataConnector {
    export class OrdrinService implements IDataService {
        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;

        private _serviceUrl = "https://sertactest.azure-mobile.net/api/ordrin"; //https://sertactest.azure-mobile.net/api/ordrin?zip=02141&city=cambridge&address=1+Cambridge+Center
        private _http;
        private _zip = "02141";
        private _city = "Cambridge";
        private _address = "1+Cambridge+Center";

        private _result;

        constructor(http) {
            this._http = http;
            this.tableNames = ["restaurants"];
        }

        public set Zip(value: string) {
            this._zip = value;
        }

        public set City(value: string) {
            this._city = value;
        }

        public set Address(value: string) {
            this._address = value;
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            console.warn("Ordrin provider does not support adding data.");
        }

        get(callback: (result: any) => void, lastSyncDates: { [tableName: string]: Date; }): void {
            var request = this._serviceUrl + "?zip=" + this._zip + "&city=" + this._city + "&address=" + this._address;
            var that = this;

            this._http.get(request).success(data => {
                if (that._result) {
                    var table = that._result[0].table;
                    for (var index = 0; index < table.length; index++) {
                        if (table[index].deleted) {
                            table.splice(index, 1);
                            index--;
                            continue;
                        }

                        table[index].deleted = true;
                    }

                    that._result[0].table = table.concat(data);

                } else {
                    that._result = [
                        {
                            tableName: "restaurants",
                            table: data
                        }
                    ];
                }


                callback(that._result);
            });
        }

        update(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            console.warn("Ordrin provider does not support updating data.");
        }

        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            console.warn("Ordrin provider does not support removing data.");
        }
    }
}

// Angular
angular.module('OrdrinDataModule', []).service('ordrinDataService', ($http) => {
    return new AngularCloudDataConnector.OrdrinService($http);
});