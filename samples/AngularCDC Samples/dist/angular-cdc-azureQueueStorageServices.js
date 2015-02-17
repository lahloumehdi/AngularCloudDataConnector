var AzureStorageAPI;
(function (AzureStorageAPI) {
    var AzureStorageQueueApi = (function () {
        function AzureStorageQueueApi(secretKey, accountName) {
            this.secretKey = secretKey;
            this.accountName = accountName;
            if (!jQuery || !jQuery.ajax) {
                throw "JQuery is required";
            }
            if (!CryptoJS || !CryptoJS.enc || !CryptoJS.HmacSHA256 || !CryptoJS.enc.Base64 || !CryptoJS.enc.Utf8) {
                throw "CryptoJS is required";
            }
        }
        AzureStorageQueueApi.prototype.getSignature = function (stringToSign) {
            return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(CryptoJS.enc.Utf8.parse(stringToSign), CryptoJS.enc.Base64.parse(this.secretKey)));
        };
        AzureStorageQueueApi.prototype.xmlToJson = function (xml) {
            // Create the return object
            var obj = {};
            if (xml.nodeType == 1) {
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            }
            else if (xml.nodeType == 3) {
                obj = xml.nodeValue;
            }
            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof (obj[nodeName]) == "undefined") {
                        obj[nodeName] = this.xmlToJson(item);
                    }
                    else {
                        if (typeof (obj[nodeName].push) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(this.xmlToJson(item));
                    }
                }
            }
            return obj;
        };
        AzureStorageQueueApi.prototype.guid = function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        };
        AzureStorageQueueApi.prototype.buildCanonicalizedResource = function (ressources) {
            if (!ressources)
                return "";
            var splitRessources = ressources.split('&');
            var objRessource = {};
            var tabRessoruces = [];
            for (var i = 0; i < splitRessources.length; i++) {
                var s = splitRessources[i].split('=');
                objRessource[s[0]] = s[1];
                tabRessoruces.push(s[0]);
            }
            var canRessources = "";
            tabRessoruces.sort();
            for (var i = 0; i < tabRessoruces.length; i++) {
                var name = tabRessoruces[i];
                canRessources = canRessources + name.toLowerCase().trim() + ':' + decodeURIComponent(objRessource[name]);
                if (i < tabRessoruces.length - 1)
                    canRessources = canRessources + '\n';
            }
            return canRessources;
        };
        AzureStorageQueueApi.prototype.xhrParams = function (xhr, path, VERB, ressources, contentLength, contentType) {
            var date = (new Date()).toGMTString();
            if (contentLength !== null) {
                xhr.setRequestHeader('Content-Length', contentLength);
            }
            else {
                contentLength = 0;
                if (VERB == 'GET')
                    contentLength = '';
                if (VERB == 'DELETE') {
                    xhr.setRequestHeader('Content-Length', "");
                    contentLength = '';
                }
            }
            if (!contentType)
                contentType = "";
            var clientid = this.guid();
            var buildCR = this.buildCanonicalizedResource(ressources);
            var stosign = VERB + "\n\n\n" + contentLength + "\n\n" + contentType + "\n\n\n\n\n\n\nx-ms-client-request-id:" + clientid + "\nx-ms-date:" + date + "\nx-ms-version:2014-02-14\n/" + this.accountName + "/" + path;
            if (buildCR)
                stosign = stosign + "\n" + buildCR;
            xhr.setRequestHeader('x-ms-date', date);
            xhr.setRequestHeader('x-ms-version', '2014-02-14');
            xhr.setRequestHeader('x-ms-client-request-id', clientid);
            xhr.setRequestHeader('Authorization', "SharedKey " + this.accountName + ":" + this.getSignature(stosign));
            return xhr;
        };
        AzureStorageQueueApi.prototype.newQueue = function (queueName, callback) {
            var that = this;
            var path = queueName;
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            var type = "PUT";
            var ressource = "";
            jQuery.ajax({
                url: urlPath + "?" + ressource,
                type: type,
                contentType: "text/xml",
                dataType: "xml",
                success: function (data) {
                    that.getListItemsInQueue(queueName, callback);
                    //do something to data
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, ressource, null, null);
                },
                error: function (rcvData) {
                    alert(rcvData.statusText);
                    console.log(rcvData);
                }
            });
        };
        AzureStorageQueueApi.prototype.getQueue = function (queueName, callback) {
            var that = this;
            var path = queueName;
            var type = "HEAD";
            var ressource = "comp=metadata";
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            jQuery.ajax({
                url: urlPath + "?" + ressource,
                type: type,
                success: function (data) {
                    that.getListItemsInQueue(queueName, callback);
                    //do something to data
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, ressource, null, null);
                },
                error: function (rcvData) {
                    if (rcvData.status == 404) {
                        that.newQueue(queueName, callback);
                    }
                    else {
                        alert(rcvData.statusText);
                    }
                    console.log(rcvData);
                }
            });
        };
        AzureStorageQueueApi.prototype.getListItemsInQueue = function (queueName, callback) {
            var that = this;
            var path = queueName + "/messages";
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            var type = "GET";
            var ressource = "numofmessages=32&visibilitytimeout=1";
            jQuery.ajax({
                url: urlPath + "?" + ressource,
                type: type,
                success: function (data) {
                    var res = that.xmlToJson(data);
                    if (res.QueueMessagesList && res.QueueMessagesList.QueueMessage) {
                        var dataList = [];
                        if (res.QueueMessagesList.QueueMessage.length) {
                            for (var i = 0; i < res.QueueMessagesList.QueueMessage.length; i++) {
                                var text = atob(res.QueueMessagesList.QueueMessage[i].MessageText['#text']);
                                var item = JSON.parse(text);
                                item.PopReceipt = res.QueueMessagesList.QueueMessage[i].PopReceipt['#text'];
                                item.MessageId = res.QueueMessagesList.QueueMessage[0].MessageId['#text'];
                                dataList.push(item);
                            }
                        }
                        else {
                            var item = JSON.parse(atob(res.QueueMessagesList.QueueMessage.MessageText['#text']));
                            item.PopReceipt = res.QueueMessagesList.QueueMessage.PopReceipt['#text'];
                            item.MessageId = res.QueueMessagesList.QueueMessage.MessageId['#text'];
                            dataList.push(item);
                        }
                        callback(dataList);
                    }
                    else
                        callback([]);
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, ressource, null, null);
                },
                error: function (rcvData) {
                    callback([]);
                    console.log(rcvData);
                }
            });
        };
        AzureStorageQueueApi.prototype.insertEntity = function (queueName, data, callback, errorCallback) {
            var that = this;
            var path = queueName + '/messages';
            var sringdata = '<?xml version="1.0" encoding="utf-8"?><QueueMessage><MessageText>' + btoa(JSON.stringify(data)) + '</MessageText></QueueMessage>';
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            var type = 'POST';
            jQuery.ajax({
                url: urlPath,
                contentType: "application/xml",
                type: type,
                data: sringdata,
                success: function (data) {
                    callback(data);
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, '', sringdata.length, "application/xml");
                    //xhr.setRequestHeader('Content-Type', '');
                },
                error: function (rcvData) {
                    console.log(rcvData);
                    errorCallback(rcvData);
                }
            });
        };
        AzureStorageQueueApi.prototype.updateEntity = function (queueName, data, callback, errorCallback) {
            var that = this;
            if (!data.MessageId) {
                errorCallback(null);
                return;
            }
            var path = queueName + "/messages/" + data.MessageId;
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            var ressources = "popreceipt=" + encodeURIComponent(data.PopReceipt) + "&visibilitytimeout=0";
            var type = 'PUT';
            delete data.MessageId;
            delete data.PopReceipt;
            var sringdata = '<?xml version="1.0" encoding="utf-8"?><QueueMessage><MessageText>' + btoa(JSON.stringify(data)) + '</MessageText></QueueMessage>';
            jQuery.ajax({
                url: urlPath + "?" + ressources,
                type: type,
                contentType: "application/xml",
                data: sringdata,
                success: function (d) {
                    callback(d);
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, ressources, sringdata.length, 'application/xml');
                },
                error: function (rcvData) {
                    console.log(rcvData);
                    errorCallback(rcvData);
                }
            });
        };
        AzureStorageQueueApi.prototype.deleteEntity = function (queueName, entity, callback, errorCallback) {
            var that = this;
            var path = queueName + "/messages/" + entity.MessageId;
            var urlPath = "https://" + this.accountName + ".queue.core.windows.net/" + path;
            var type = 'DELETE';
            var ressources = "popreceipt=" + encodeURIComponent(entity.PopReceipt);
            jQuery.ajax({
                url: urlPath + "?" + ressources,
                type: type,
                success: function (d) {
                    callback(null);
                },
                beforeSend: function (xhr) {
                    xhr = that.xhrParams(xhr, path, type, ressources, null, null);
                },
                error: function (rcvData) {
                    jQuery.ajax({
                        url: urlPath + "?" + ressources,
                        type: type,
                        success: function (d) {
                            callback(null);
                        },
                        beforeSend: function (xhr) {
                            xhr = that.xhrParams(xhr, path, type, ressources, 0, null);
                        },
                        error: function (rcvData) {
                            errorCallback(rcvData);
                            console.log(rcvData);
                        }
                    });
                    console.log(rcvData);
                }
            });
        };
        return AzureStorageQueueApi;
    })();
    AzureStorageAPI.AzureStorageQueueApi = AzureStorageQueueApi;
    ;
})(AzureStorageAPI || (AzureStorageAPI = {}));
/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="azurestoragequeueapi.ts" />
/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/angular-cdc.d.ts" />
var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    var AzureQueueStorageService = (function () {
        function AzureQueueStorageService() {
            this.tableNames = new Array();
        }
        AzureQueueStorageService.prototype.addSource = function (accountName, secretKey, queueNames) {
            var client = new AzureStorageAPI.AzureStorageQueueApi(secretKey, accountName);
            this.azureClient = client;
            this.tableNames = queueNames;
        };
        // the callback is called with an array of objects { tableName: <tableName>, table: <array> }
        AzureQueueStorageService.prototype.get = function (updateCallback, lastSyncDates) {
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
        AzureQueueStorageService.prototype._getTable = function (queueName, callback, lastDate) {
            this.azureClient.getQueue(queueName, function (queue) {
                var result = { 'tableName': queueName, 'table': queue };
                callback(result);
            });
        };
        AzureQueueStorageService.prototype.remove = function (queueName, entity, onsuccess, onerror) {
            this.azureClient.deleteEntity(queueName, entity, onsuccess, onerror);
        };
        AzureQueueStorageService.prototype.update = function (queueName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            this.azureClient.updateEntity(queueName, entity, onsuccess, onerror);
        };
        AzureQueueStorageService.prototype.add = function (queueName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            var Table = this.azureClient.insertEntity(queueName, entity, onsuccess, onerror);
        };
        return AzureQueueStorageService;
    })();
    AngularCloudDataConnector.AzureQueueStorageService = AzureQueueStorageService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));
// Angular
var angularCDCAzureQueueStorageServices = new AngularCloudDataConnector.AzureQueueStorageService();
angular.module('AngularCDC.AzureQueueStorageServices', []).value('angularCDCAzureQueueStorageServices', angularCDCAzureQueueStorageServices);
