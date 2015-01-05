/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ /// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/angular-cdc.d.ts" />
var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    var TwitterService = (function () {
        function TwitterService(http) {
            this.tableNames = new Array();
            this._serviceUrl = "https://angularpeoplev2.azure-mobile.net/api/fetchtweets?q=";
            this._hashTag = "babylonjs";
            this._http = http;
            this.tableNames = ["tweets"];
        }
        Object.defineProperty(TwitterService.prototype, "HashTag", {
            set: function (value) {
                this._hashTag = value;
            },
            enumerable: true,
            configurable: true
        });

        TwitterService.prototype.get = function (callback, lastSyncDate) {
            var request = this._serviceUrl + this._hashTag;
            var that = this;

            this._http.get(request).success(function (data) {
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
        };

        TwitterService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            console.warn("Twitter provider does not support adding data.");
        };

        TwitterService.prototype.update = function (tableName, entity, onsuccess, onerror) {
            console.warn("Twitter provider does not support updating data.");
        };

        TwitterService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            console.warn("Twitter provider does not support removing data.");
        };
        return TwitterService;
    })();
    AngularCloudDataConnector.TwitterService = TwitterService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));

// Angular
angular.module('TwitterDataModule', []).service('twitterDataService', function ($http) {
    return new AngularCloudDataConnector.TwitterService($http);
});
//# sourceMappingURL=twitterDataService.js.map
