var AzureStorageTableApi = (function () {
    function AzureStorageTableApi(secretKey, accountName) {
        this.secretKey = secretKey;
        this.accountName = accountName;
        if (!CryptoJS || !CryptoJS.enc || !CryptoJS.HmacSHA256 || !CryptoJS.enc.Base64 || !CryptoJS.enc.Utf8) {
            throw "CryptoJS is required";
        }
    }
    AzureStorageTableApi.prototype.getSignature = function (stringToSign) {
        return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(CryptoJS.enc.Utf8.parse(stringToSign), CryptoJS.enc.Base64.parse(this.secretKey)));
    };
    AzureStorageTableApi.prototype.setHeaders = function (path) {
        var headers = {};
        var date = (new Date()).toUTCString();
        var stringToSign = date + "\n" + "/" + this.accountName + "/" + path;
        headers['Authorization'] = "SharedKeyLite " + this.accountName + ":" + this.getSignature(stringToSign);
        headers['x-ms-date'] = date;
        headers['x-ms-version'] = '2014-02-14';
        headers['Accept'] = 'application/json;odata=nometadata';
        headers['DataServiceVersion'] = '3.0;NetFx';
        headers['MaxDataServiceVersion'] = '3.0;NetFx';
        return headers;
    };
    AzureStorageTableApi.prototype.performRequest = function (request, callback, error) {
        var headers = request.headers || {}, url = request.url.replace(/#.*$/, ""), httpMethod = request.type ? request.type.toUpperCase() : "GET", xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        callback(data);
                    }
                    catch (e) {
                        callback(null);
                    }
                }
                else {
                    error(xhr);
                }
            }
        };
        xhr.open(httpMethod, url);
        for (var key in headers) {
            if (request.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, request.headers[key]);
            }
        }
        xhr.send(request.data);
    };
    AzureStorageTableApi.prototype.getTable = function (tableName, callback) {
        var that = this;
        var path = "Tables('" + tableName + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req, function (data) {
            that.getListItemsInTable(tableName, tableName, callback);
        }, function error(xhr) {
            if (xhr && xhr.status === 404) {
                var path = "Tables()";
                var urlPath = "https://" + that.accountName + ".table.core.windows.net/" + path;
                var jsondata = '{"TableName":"' + tableName + '"}';
                var req = { url: urlPath, type: "POST", headers: that.setHeaders(path), data: jsondata };
                req.headers['Content-Length'] = jsondata.length + "";
                req.headers['Content-Type'] = "application/json";
                that.performRequest(req, function () {
                    that.getListItemsInTable(tableName, tableName, callback);
                }, function (xhr) {
                    console.log(xhr);
                });
            }
        });
    };
    AzureStorageTableApi.prototype.getListItemsInTable = function (tableName, partitionKey, callback) {
        var that = this;
        var path = tableName;
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath + encodeURI("?$filter=PartitionKey eq '" + partitionKey + "'"), type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req, function (data) {
            callback(data.value);
        }, function error(xhr) {
            callback([]);
            console.log(xhr);
        });
    };
    AzureStorageTableApi.prototype.insertEntity = function (tableName, data, callback, errorCallback) {
        var that = this;
        var path = tableName + '()';
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        if (!data.PartitionKey || !data.RowKey) {
            throw "PartitionKey and RowKey is required";
        }
        var jsondata = JSON.stringify(data);
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "POST", headers: that.setHeaders(path), data: jsondata };
        req.headers['Content-Length'] = jsondata.length + "";
        req.headers['Content-Type'] = "application/json";
        that.performRequest(req, function (data) {
            callback(data);
        }, function error(xhr) {
            console.log(xhr);
            errorCallback(xhr);
        });
    };
    AzureStorageTableApi.prototype.updateEntity = function (tableName, data, callback, errorCallback) {
        var that = this;
        var path = tableName + "(PartitionKey='" + data.PartitionKey + "',RowKey='" + data.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        delete data.RowKey;
        delete data.PartitionKey;
        var jsondata = JSON.stringify(data);
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path), data: jsondata };
        that.performRequest(req, function (data) {
            var urlPath = "https://" + that.accountName + ".table.core.windows.net/" + path;
            var req = { url: urlPath, type: "PUT", headers: that.setHeaders(path), data: jsondata };
            req.headers['If-Match'] = "W/\"datetime'" + encodeURIComponent(data.Timestamp) + "'\"";
            req.headers['Content-Type'] = "application/json";
            that.performRequest(req, function (data) {
                callback(data);
            }, function error(xhr) {
                console.log(xhr);
                errorCallback(xhr);
            });
        }, function error(xhr) {
            console.log(xhr);
            errorCallback(xhr);
        });
    };
    AzureStorageTableApi.prototype.deleteEntity = function (tableName, entity, callback, errorCallback) {
        var that = this;
        var path = tableName + "(PartitionKey='" + entity.PartitionKey + "',RowKey='" + entity.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req, function (data) {
            var req = { url: urlPath, type: "DELETE", headers: that.setHeaders(path) };
            req.headers['If-Match'] = "W/\"datetime'" + encodeURIComponent(data.Timestamp) + "'\"";
            that.performRequest(req, function (data) {
                callback(data);
            }, function error(xhr) {
                console.log(xhr);
                errorCallback(xhr);
            });
        }, function error(xhr) {
            console.log(xhr);
            errorCallback(xhr);
        });
    };
    return AzureStorageTableApi;
})();
;
/// <reference path="azurestoragetableapi.ts" />
/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />
var CloudDataConnector;
(function (CloudDataConnector) {
    var AzureTableStorageService = (function () {
        function AzureTableStorageService() {
            this.tableNames = new Array();
        }
        AzureTableStorageService.prototype.addSource = function (accountName, secretKey, tableNames) {
            var client = new AzureStorageTableApi(secretKey, accountName);
            this.azureClient = client;
            this.tableNames = tableNames;
        };
        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        AzureTableStorageService.prototype.get = function (updateCallback, lastSyncDates) {
            this.dataAvailableCallback = updateCallback;
            var count = 0;
            var total = this.tableNames.length;
            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                this._getTable(tableName, function (resultElement) {
                    count++;
                    updateCallback([resultElement]);
                    if (count === total) {
                    } //!+ request is finished.  Might be interesting to have a callback to top level code called at this point.
                }, lastSyncDate);
            }
        };
        AzureTableStorageService.prototype._getTable = function (tableName, callback, lastDate) {
            this.azureClient.getTable(tableName, function (table) {
                var result = { 'tableName': tableName, 'table': table };
                callback(result);
            });
        };
        AzureTableStorageService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            this.azureClient.deleteEntity(tableName, entity, onsuccess, onerror);
        };
        AzureTableStorageService.prototype.update = function (tableName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            this.azureClient.updateEntity(tableName, entity, onsuccess, onerror);
        };
        AzureTableStorageService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            this.azureClient.insertEntity(tableName, entity, onsuccess, onerror);
        };
        return AzureTableStorageService;
    })();
    CloudDataConnector.AzureTableStorageService = AzureTableStorageService;
})(CloudDataConnector || (CloudDataConnector = {}));
/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="azuretablestorageservices.ts" />
// Angular
var angularCDCAzureTableStorageServices = new CloudDataConnector.AzureTableStorageService();
angular.module('AngularCDC.AzureTableStorageServices', []).value('angularCDCAzureTableStorageServices', angularCDCAzureTableStorageServices);
