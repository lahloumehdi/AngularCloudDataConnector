/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />

module CloudDataConnector {
    export class TwitterService implements IDataService {
        public tableNames = new Array<string>();
        public _dataId: number;
        public _lastSyncDate: Date;

        private _serviceUrl = "https://angularpeoplev2.azure-mobile.net/api/fetchtweets?q=";
        private _http;
        private _hashTag = "babylonjs";
        private _result;

        constructor(http) {
            this._http = http;
            this.tableNames = ["tweets"];
        }

        public set HashTag(value: string) {
            this._hashTag = value;
        }

        get(callback: (result: any) => void, lastSyncDate: { [tableName: string]: Date; }): void {
            var request = this._serviceUrl + this._hashTag;
            var that = this;

            this._http.get(request).success(data => {
                if (that._result) {
                    var table = that._result[0].table;
                    for (var index = 0; index < table.length; index++) {
                        if (table[index].sync_deleted) { 
                            table.splice(index, 1);
                            index--;
                            continue;
                        }

                        table[index].sync_deleted = true; 
                    }

                    that._result[0].table = table.concat(data.statuses);

                } else {
                    that._result = [
                        {
                            tableName: "tweets",
                            table: data.statuses
                        }
                    ];
                }
                

                callback(that._result);
            });
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            console.warn("Twitter provider does not support adding data.");
        }
  
        update(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            console.warn("Twitter provider does not support updating data.");
        }

        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            console.warn("Twitter provider does not support removing data.");
        }
    }
}

// Angular
angular.module('TwitterDataModule', []).service('twitterDataService', ($http) => {
    return new CloudDataConnector.TwitterService($http);
});