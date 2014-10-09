/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 
/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ /// <reference path="../../core/IDataService.ts" />
"use strict";

var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    //! The following classes exist only to help Tim identify the APIs that we really want for app development.  This will come down in the NitrogenApp.js file.
    var NitrogenPrincipal = (function () {
        function NitrogenPrincipal() {
        }
        return NitrogenPrincipal;
    })();
    AngularCloudDataConnector.NitrogenPrincipal = NitrogenPrincipal;

    var NitrogenPrincipals = (function () {
        function NitrogenPrincipals() {
            var initialItems = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                initialItems[_i] = arguments[_i + 0];
            }
            var me = Object.create(Array.prototype);

            this.init(me, initialItems, NitrogenPrincipals.prototype);

            return me;
        }
        NitrogenPrincipals.prototype.init = function (me, initialItems, prototype) {
            Object.getOwnPropertyNames(prototype).forEach(function (prop) {
                if (prop === 'constructor')
                    return;
                Object.defineProperty(me, prop, { value: prototype[prop] });
            });

            Object.defineProperty(me, 'length', {
                value: me.length,
                writable: true,
                enumerable: false
            });

            var itemsToPush = initialItems;
            if (Array.isArray(initialItems[0]) && initialItems.length === 1) {
                itemsToPush = initialItems[0];
            }
            Array.prototype.push.apply(me, itemsToPush);

            return me;
        };

        // Find an element by checking each element's getId() method
        NitrogenPrincipals.prototype.search = function (callback) {
            var _this = this;
            console.log("Searching");
            var since = new Date(1900, 1, 1);
            nitrogen.Principal.find(this.nitrogen, { type: 'device', created_at: { $gt: since.getTime() } }, {}, function (err, devices) {
                if (err) {
                    return console.log('failed to discover devices: ' + err);
                }
                var me = _this;
                me.length = 0;
                for (var i = 0; i < devices.length; i++) {
                    var d = new NitrogenPrincipal();
                    var x = devices[i];
                    d.id = x.id;
                    d.nickname = x.name;
                    d.network = x.network;
                    me.push(d);
                }
                callback();
            });
        };
        return NitrogenPrincipals;
    })();
    AngularCloudDataConnector.NitrogenPrincipals = NitrogenPrincipals;

    var NitrogenReading = (function () {
        function NitrogenReading() {
        }
        return NitrogenReading;
    })();
    AngularCloudDataConnector.NitrogenReading = NitrogenReading;

    var NitrogenAppApi = (function () {
        function NitrogenAppApi(nitrogen) {
            this.nitrogen = nitrogen;
            this.principals = new NitrogenPrincipals();
            this.principals.nitrogen = nitrogen;
        }
        return NitrogenAppApi;
    })();
    AngularCloudDataConnector.NitrogenAppApi = NitrogenAppApi;

    // real code starts here.
    var NitrogenDataService = (function () {
        function NitrogenDataService() {
            this.tableNames = new Array();
            this.tableNames.push('devices');
            this.tableNames.push('readings');

            this.devicesWatcher = null;
            this.stateWatcher = null;
        }
        // use test@nitrogen.io and 'DxTest12'
        NitrogenDataService.prototype.connect = function (in_email, in_password, callback) {
            var _this = this;
            // Default config
            var config = {
                host: 'api.nitrogen.io',
                http_port: 443,
                protocol: 'https'
            };

            this.nitrogenService = new nitrogen.Service(config);

            var user = new nitrogen.User({
                email: in_email,
                password: in_password
            });
            var myCallback = callback;

            // Login as user
            this.nitrogenService.authenticate(user, function (err, session, user) {
                if (err)
                    return console.log('failed to connect user: ' + err);
                _this.nitrogenSession = session;
                _this.nitrogenAppApi = new NitrogenAppApi(_this.nitrogenSession); // Future
                myCallback(err);
            });
        };

        NitrogenDataService.prototype.loadDevices = function (initialCallback, incrementalCallbacks, since) {
            var _this = this;
            if (since === null) {
                since = new Date(1900, 1, 1);
            }
            var self = this;

            this.nitrogenAppApi.principals.search(function () {
                console.dir(_this.nitrogenAppApi.principals);
            }); // Future

            nitrogen.Principal.find(this.nitrogenSession, { type: 'device', created_at: { $gt: since.getTime() } }, {}, function (err, devices) {
                if (err) {
                    return console.log('failed to discover devices: ' + err);
                }

                //! Do fixup on created_at to sync_updated.
                // for each device, create or tombstone devices if the list has changed.
                console.dir(devices);

                // Turn on Watcher if necessary
                if (self.devicesWatcher === null) {
                    self.devicesWatcher = true;
                    self.startDevicesWatcher(since, incrementalCallbacks);
                }

                //! fix result
                var result = { tableName: 'devices', table: devices };
                initialCallback([result]);
            });
        };

        NitrogenDataService.prototype.startDevicesWatcher = function (lastDate, callback) {
            if (lastDate === null) {
                lastDate = new Date(1900, 1, 1);
            }

            // this is the callback and I would have my lastDate
            this.nitrogenSession.onPrincipal({ type: 'device', updated_at: { $gt: lastDate.getTime() } }, function (principal) {
                console.dir(principal);
                var result = { tableName: 'devices', table: [principal] };
                callback([result]);
            });
        };

        NitrogenDataService.prototype.loadState = function (initialCallback, incrementalCallback, deviceIds, lastSyncDate) {
            var since = (lastSyncDate !== null) ? lastSyncDate : new Date(1900, 1, 1);

            nitrogen.Message.find(this.nitrogenSession, { ts: { $gt: since.getTime() } }, { limit: 1000, sort: { ts: -1 } }, function (err, messages) {
                if (err) {
                    return console.log('failed to discover readings: ' + err);
                }

                //! Do fixup on created_at to sync_updated.
                // for each device, create or tombstone devices if the list has changed.
                console.dir(messages);

                //! Turn on watcher
                var result = { tableName: 'readings', table: messages };
                initialCallback([result]);
            });
            // find 'from: deviceId'
            // For messages - since they are immutable copy the TS to sync_updated for ACDC.
        };

        // the Get callback is called with an array of objects { tableName: <tableName>, table: <array> }
        // With Nitrogen there are just two tables but you want to load them all in parallel so return only when all data is available.
        //!  Should review ADCD to make it such that the callback can always be called.
        NitrogenDataService.prototype.get = function (callback, lastSyncDates) {
            var count = 0;
            var total = this.tableNames.length;
            var result = [];

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                if (tableName === 'devices') {
                    this.loadDevices(callback, callback, lastSyncDate);
                } else if (tableName === 'readings') {
                    this.loadState(callback, callback, null, lastSyncDate);
                }
            }
        };

        NitrogenDataService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
        };

        NitrogenDataService.prototype.update = function (tableName, entity, onsuccess, onerror) {
        };

        NitrogenDataService.prototype.add = function (tableName, entity, onsuccess, onerror) {
        };
        return NitrogenDataService;
    })();
    AngularCloudDataConnector.NitrogenDataService = NitrogenDataService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));

// Angular
var nitrogenDataService = new AngularCloudDataConnector.NitrogenDataService();
angular.module('NitrogenDataModule', []).value('nitrogenDataService', nitrogenDataService);
//# sourceMappingURL=NitrogenService.js.map
