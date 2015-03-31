/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />
"use strict";
//! Get rid of the above.
var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    var FacebookDataService = (function () {
        function FacebookDataService(facebook) {
            this.tableNames = new Array();
            this.facebookClient = facebook;
            this.tableToPath = new Object;
        }
        FacebookDataService.prototype.ensureLogin = function (onsuccess) {
            var _this = this;
            this.facebookClient.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    _this.loggedIn = true;
                    onsuccess();
                }
                else {
                    _this.facebookClient.login(function (response) {
                        onsuccess();
                    }, { scope: 'read_stream' });
                }
            });
        };
        FacebookDataService.prototype.login = function (onsuccess) {
            var _this = this;
            this.facebookClient.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    _this.loggedIn = true;
                    onsuccess();
                }
                else {
                    _this.facebookClient.login(function (response) {
                        onsuccess();
                    }, { scope: 'read_stream' });
                }
            });
        };
        FacebookDataService.prototype.api = function (path, callback) {
            var _this = this;
            this.ensureLogin(function () {
                _this.facebookClient.api(path, callback);
            });
        };
        FacebookDataService.prototype.addSource = function (tableNamesAndPaths) {
            for (var i = 0; i < tableNamesAndPaths.length; i++) {
                this.tableNames.push(tableNamesAndPaths[i].tableName);
                this.tableToPath[tableNamesAndPaths[i].tableName] = tableNamesAndPaths[i].path;
            }
        };
        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        FacebookDataService.prototype.get = function (callback, lastSyncDates) {
            var count = 0;
            var total = this.tableNames.length;
            var result = [];
            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                this._getTable(tableName, function (resultElement) {
                    result[count] = resultElement;
                    count++;
                    if (count === total) {
                        callback(result);
                    }
                }, lastSyncDates[tableName]);
            }
        };
        FacebookDataService.prototype._getTable = function (tableName, callback, lastDate) {
            var path = this.tableToPath[tableName];
            this.api(path, function (response) {
                var table;
                if (response.hasOwnProperty('data')) {
                    table = response.data;
                }
                else {
                    table = [response];
                }
                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            });
        };
        FacebookDataService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            var Table = this.azureClient.getTable(tableName);
            Table.del({ id: entity.id }).then(onsuccess, onerror);
        };
        FacebookDataService.prototype.update = function (tableName, entity, onsuccess, onerror) {
            // stub
        };
        FacebookDataService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            var Table = this.azureClient.getTable(tableName);
            Table.insert(entity).then(function (newProperty) {
                onsuccess(newProperty);
            }, onerror);
        };
        return FacebookDataService;
    })();
    AngularCloudDataConnector.FacebookDataService = FacebookDataService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));
// Angular
var facebookDataModule = angular.module('FacebookDataModule', ['facebook']);
facebookDataModule.config(['FacebookProvider', function (FacebookProvider) {
    // Here you could set your appId through the setAppId method and then initialize
    // or use the shortcut in the initialize method directly.
    FacebookProvider.init('704100033000816');
}]);
facebookDataModule.service('facebookDataService', function (Facebook) {
    return new AngularCloudDataConnector.FacebookDataService(Facebook);
});
