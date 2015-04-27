/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */
/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
var __global = this;

var CloudDataConnector;
(function (CloudDataConnector) {
    var ConnectivityService = (function () {
        function ConnectivityService() {
            // Members
            this.onlineStatus = ConnectivityService.NotDefinedStatus;
            this.statusChangeFns = new Array();
        }
        Object.defineProperty(ConnectivityService, "OnlineStatus", {
            get: function () {
                return ConnectivityService._OnlineStatus;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ConnectivityService, "LocalStatus", {
            get: function () {
                return ConnectivityService._LocalStatus;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ConnectivityService, "NotDefinedStatus", {
            get: function () {
                return ConnectivityService._NotDefinedStatus;
            },
            enumerable: true,
            configurable: true
        });

        // Methods
        ConnectivityService.prototype.addStatusChangeNotify = function (notifyFn) {
            this.statusChangeFns.push(notifyFn);
        };

        ConnectivityService.prototype.getStatus = function () {
            if (this.onlineStatus === ConnectivityService.NotDefinedStatus) {
                this.resetStatus();
            }
            return this.onlineStatus;
        };

        ConnectivityService.prototype.setStatus = function (value) {
            var notifyChange = value != this.onlineStatus;
            this.onlineStatus = value;
            if (notifyChange) {
                this.statusChangeFns.forEach(function (fn, index) {
                    fn();
                });
            }
        };

        ConnectivityService.prototype.resetStatus = function () {
            var _this = this;
            this.setStatus(navigator.onLine ? ConnectivityService.OnlineStatus : ConnectivityService.LocalStatus);

            if (__global.addEventListener) {
                __global.addEventListener("online", function () {
                    _this.setStatus(ConnectivityService.OnlineStatus);
                }, true);
                __global.addEventListener("offline", function () {
                    _this.setStatus(ConnectivityService.LocalStatus);
                }, true);
            }
        };

        ConnectivityService.prototype.isOnline = function () {
            return this.getStatus() === ConnectivityService.OnlineStatus;
        };
        ConnectivityService._NotDefinedStatus = "not defined";
        ConnectivityService._OnlineStatus = "online";
        ConnectivityService._LocalStatus = "online";
        return ConnectivityService;
    })();
    CloudDataConnector.ConnectivityService = ConnectivityService;
})(CloudDataConnector || (CloudDataConnector = {}));
//# sourceMappingURL=connectivityService.js.map
