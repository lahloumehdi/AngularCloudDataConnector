/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />

"use strict";

declare var WindowsAzure;
//! Get rid of the above.

module AngularCloudDataConnector {

    export interface TableNameAndPath {
        tableName: string;
        path: string;
		
    }
    

    export class FacebookDataService implements IDataService {
        private facebookClient: any;
        private azureClient: any;

        public tableNames = new Array<string>();
        public tableToPath;

        public _dataId: number;
        public _lastSyncDate: Date;

        public loggedIn;

        constructor(facebook) {
            this.facebookClient = facebook;
            this.tableToPath = new Object;     
        }

        public facebookResponse;

        public ensureLogin(onsuccess : () => void) {
            this.facebookClient.getLoginStatus((response) => {
                if (response.status === 'connected') {
                    this.loggedIn = true;
                    onsuccess();
                } else {
                    this.facebookClient.login(response => {
                        onsuccess();
                    }, { scope: 'read_stream' });   
                }
            });
        }

        public login(onsuccess: () => void) {
            this.facebookClient.getLoginStatus((response) => {
                if (response.status === 'connected') {
                    this.loggedIn = true;
                    onsuccess();
                } else {
                    this.facebookClient.login(response => {
                        onsuccess();
                    }, { scope: 'read_stream' });
                }
            });
        }


        public api(path: string, callback: (response: Object) => void) {
            this.ensureLogin(() => {
                this.facebookClient.api(path, callback);
            });            
        }
        
        public addSource(tableNamesAndPaths: TableNameAndPath[]) {
            for (var i = 0; i < tableNamesAndPaths.length; i++) {
                this.tableNames.push(tableNamesAndPaths[i].tableName);
                this.tableToPath[tableNamesAndPaths[i].tableName] = tableNamesAndPaths[i].path;
            }
        }

        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        get(callback: (result: any) => void, lastSyncDates: { [tableName: string]: Date; }): void {
            var count = 0;
            var total = this.tableNames.length;
            var result = [];

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                this._getTable(tableName,
                    (resultElement) => {
                        result[count] = resultElement;
                        count++;
                        if (count === total) {
                            callback(result);
                        }
                    }, lastSyncDates[tableName]) 
            }
        }

        private _getTable(tableName: string, callback: (result: any) => void, lastDate: Date): void {
            var path = this.tableToPath[tableName];         
            this.api(path, (response: any) => {
                var table;
                if (response.hasOwnProperty('data')) {
                    table = response.data;
                } else {
                    table = [response];
                }
                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            });                        
        }

        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
            var Table = this.azureClient.getTable(tableName);
            Table.del({ id: entity.id }).then(onsuccess, onerror);
        }

        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            // stub
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
            var Table = this.azureClient.getTable(tableName);
            Table.insert(entity).then(newProperty => {
                onsuccess(newProperty);
            }, onerror);
        }
    }
}

// Angular
var facebookDataModule = angular.module('FacebookDataModule', ['facebook']);

facebookDataModule.config(['FacebookProvider', (FacebookProvider) => {
    // Here you could set your appId through the setAppId method and then initialize
    // or use the shortcut in the initialize method directly.
    FacebookProvider.init('704100033000816');
}]);

facebookDataModule.service('facebookDataService', (Facebook) => { return new AngularCloudDataConnector.FacebookDataService(Facebook); });
