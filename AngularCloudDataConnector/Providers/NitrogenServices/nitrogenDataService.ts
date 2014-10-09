/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../core/IDataService.ts" />

"use strict";

// The following script must be included in the top app file.
// <script src="//api.nitrogen.io/client/nitrogen.js"></script>
declare var nitrogen;



module AngularCloudDataConnector {

    //! The following classes exist only to help Tim identify the APIs that we really want for app development.  This will come down in the NitrogenApp.js file.

    export class NitrogenPrincipal {
        id: string;
        key: string;
        network: string;
        nickname: string;
        sensors: { id: number; type: string; nickname: string }[];
        actuators: { id: number; type: string; nickname: string }[];
    }

    export class NitrogenPrincipals implements Array<NitrogenPrincipal> {
        public nitrogen: any;

        constructor(...initialItems: any[]) {
            var me = Object.create(Array.prototype);

            this.init(me, initialItems, NitrogenPrincipals.prototype);

            return me;
        }

        public init(me, initialItems: any[], prototype) {
            Object.getOwnPropertyNames(prototype)
                .forEach((prop) => {
                    if (prop === 'constructor') return;
                    Object.defineProperty(me, prop, { value: prototype[prop] })
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
        }

        // Find an element by checking each element's getId() method
        public search(callback : () => void) {
            console.log("Searching");
            var since = new Date(1900, 1, 1);
            nitrogen.Principal.find(this.nitrogen, { type: 'device', created_at: { $gt: since.getTime() } }, {}, (err, devices : any[]) => {
                if (err) {
                    return console.log('failed to discover devices: ' + err);
                }
                var me: Array<NitrogenPrincipal> = this;
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
        }

        // dummy declarations
        // "massaged" the Array interface definitions in lib.d.ts to fit here
        toString: () => string;
        toLocaleString: () => string;
        concat: (...items: NitrogenPrincipal[]) => NitrogenPrincipal[];
        join: (separator?: string) => string;
        pop: () => NitrogenPrincipal;
        push: (...items: NitrogenPrincipal[]) => number;
        reverse: () => NitrogenPrincipal[];
        shift: () => NitrogenPrincipal;
        slice: (start?: number, end?: number) => NitrogenPrincipal[];
        sort: (compareFn?: (a: NitrogenPrincipal, b: NitrogenPrincipal) => number) => NitrogenPrincipal[];
        splice: (start?: number, deleteCount?: number, ...items: NitrogenPrincipal[]) => NitrogenPrincipal[];
        unshift: (...items: NitrogenPrincipal[]) => number;
        indexOf: (searchElement: NitrogenPrincipal, fromIndex?: number) => number;
        lastIndexOf: (searchElement: NitrogenPrincipal, fromIndex?: number) => number;
        every: (callbackfn: (value: NitrogenPrincipal, index: number, array: NitrogenPrincipal[]) => boolean, thisArg?: any) => boolean;
        some: (callbackfn: (value: NitrogenPrincipal, index: number, array: NitrogenPrincipal[]) => boolean, thisArg?: any) => boolean;
        forEach: (callbackfn: (value: NitrogenPrincipal, index: number, array: NitrogenPrincipal[]) => void, thisArg?: any) => void;
        map: <U>(callbackfn: (value: NitrogenPrincipal, index: number, array: NitrogenPrincipal[]) => U, thisArg?: any) => U[];
        filter: (callbackfn: (value: NitrogenPrincipal, index: number, array: NitrogenPrincipal[]) => boolean, thisArg?: any) => NitrogenPrincipal[];
        reduce: <U>(callbackfn: (previousValue: U, currentValue: NitrogenPrincipal, currentIndex: number, array: NitrogenPrincipal[]) => U, initialValue: U) => U;
        reduceRight: <U>(callbackfn: (previousValue: U, currentValue: NitrogenPrincipal, currentIndex: number, array: NitrogenPrincipal[]) => U, initialValue: U) => U;
        length: number;
        [n: number]: NitrogenPrincipal;
    }

    export class NitrogenReading {
    }

    export class NitrogenAppApi {
        public nitrogen;
        public principals: NitrogenPrincipals;
        public readings: NitrogenReading[];
        public constructor(nitrogen) {
            this.nitrogen = nitrogen;
            this.principals = new NitrogenPrincipals();
            this.principals.nitrogen = nitrogen;                    
        }
    }


    // real code starts here.

    export class NitrogenDataService implements IDataService {
        public nitrogenService: any;
        public nitrogenSession: any;
        public azureDataService: any;
        public devicesWatcher: any;
        public stateWatcher: any;
        public _dataId: number;

        public nitrogenAppApi: NitrogenAppApi;  // Future - would just need this.

        public tableNames = new Array<string>();

        public constructor() {
            this.tableNames.push('devices');
            this.tableNames.push('readings');

            this.devicesWatcher = null;
            this.stateWatcher = null;
        }

        // use test@nitrogen.io and 'DxTest12'
        public connect(in_email: string, in_password: string, callback : (err) => void) {
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
            this.nitrogenService.authenticate(user, (err, session, user) => {
                if (err) return console.log('failed to connect user: ' + err);
                this.nitrogenSession = session;
                this.nitrogenAppApi = new NitrogenAppApi(this.nitrogenSession); // Future
                myCallback(err);
            });
        }

        public loadDevices(initialCallback : (any) => void, incrementalCallbacks: (any) => void, since?: Date) {
            if (since === null) { since = new Date(1900, 1, 1); }
            var self = this;

            this.nitrogenAppApi.principals.search(() => { console.dir(this.nitrogenAppApi.principals); }); // Future

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
        }

        public startDevicesWatcher(lastDate: Date, callback: (any) => void)
        {
            if (lastDate === null) { lastDate = new Date(1900, 1, 1); }
            // this is the callback and I would have my lastDate
            this.nitrogenSession.onPrincipal({ type: 'device', updated_at: { $gt: lastDate.getTime() } }, function (principal) {
                console.dir(principal);
                var result = { tableName: 'devices', table: [principal] };
                callback([result]);
            });
        }

        public loadState(initialCallback: (any) => void, incrementalCallback: (any) => void, deviceIds : string[] , lastSyncDate? : Date) {
            var since = (lastSyncDate !== null) ? lastSyncDate : new Date(1900, 1, 1); 

            nitrogen.Message.find(this.nitrogenSession, { ts: { $gt: since.getTime() } }, { limit : 1000, sort: { ts: -1 } }, function (err, messages) {
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

        }

        // the Get callback is called with an array of objects { tableName: <tableName>, table: <array> }
        // With Nitrogen there are just two tables but you want to load them all in parallel so return only when all data is available.  
        //!  Should review ADCD to make it such that the callback can always be called.
        public get(callback: (result: any) => void, lastSyncDates: any): void {
            var count = 0;
            var total = this.tableNames.length;
            var result = [];

            var tableName;
            for (var x = 0; x < total; x++) {
                tableName = this.tableNames[x];
                var lastSyncDate = lastSyncDates[tableName];
                if (tableName === 'devices') {
                    this.loadDevices( callback, callback, lastSyncDate);
                } else if (tableName === 'readings') {
                    this.loadState(callback, callback, null, lastSyncDate);
                }
            }
        }

        public remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void {
        }

        public update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
        }

        public add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void {
        }
    }
}

// Angular
var nitrogenDataService = new AngularCloudDataConnector.NitrogenDataService();
angular.module('NitrogenDataModule', []).value('nitrogenDataService', nitrogenDataService);
 