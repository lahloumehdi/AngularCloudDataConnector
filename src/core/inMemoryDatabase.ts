/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />

module AngularCloudDataConnector.Internals {
    // The goal of this class is to provide a IDB API using only in-memory storage

    export class InMemoryRequest {
        public onerror = null;
        public onblocked = null;
        public onsuccess = null;
        public onupgradeneeded = null;

        constructor(public result: InMemoryDatabase) {
            setTimeout(() => { // This timeout simulates the asynchronous way of working of IDB
                if (this.onupgradeneeded) {
                    this.onupgradeneeded({ target: { result: this.result } });
                }

                if (this.onsuccess) {
                    this.onsuccess();
                }
            }, 0);
        }
    }

    export class InMemoryTransaction {
        public oncomplete: () => void;
        public onabort: () => void;
        private _db: InMemoryDatabase;

        constructor(db: InMemoryDatabase) {
            this._db = db;
            setTimeout(() => { // This timeout simulates out of scope completion
                if (this.oncomplete) {
                    this.oncomplete();
                }
            }, 0);
        }

        public objectStore(name: string): InMemoryTransactionalStoreObject{
            return new InMemoryTransactionalStoreObject(<InMemoryStoreObject>this._db._objectStores[name], this);
        }
    }

    export class InMemoryStoreObject{
        public data = [];

        constructor(public keypath: string) {
            
        }
    }

    export class InMemoryTransactionalStoreObject{
        constructor(public objectStore: InMemoryStoreObject, public transaction: InMemoryTransaction) {
        }

        public delete(idToDelete: string) {
            if (this.objectStore.data[idToDelete]) {
                delete this.objectStore.data[idToDelete];
            }
        }

        public put(value: any): void {
            var key = value[this.objectStore.keypath];
            this.objectStore.data[key] = value; // Add or update
        }

        public openCursor(): InMemoryCursor {
            return new InMemoryCursor(this.objectStore);
        }

        public clear(): void {
            this.objectStore.data = [];
        }
    }

    export class InMemoryCursor {
        public onsuccess;
        private _position = -1;
        private _keys;

        public get value(): any {
            return this.objectStore.data[this._keys[this._position]];
        }

        public continue(): void {
            this._position++;

            var nextCursor = this._position < this._keys.length ? this : null;

            setTimeout(() => { // This timeout simulates the asynchronous way of working of IDB
                if (this.onsuccess) {
                    this.onsuccess({ target: { result: nextCursor } });
                }
            }, 0);
        }

        constructor(public objectStore: InMemoryStoreObject) {
            this._keys = [];

            // save current keys values to fetch data afterwards
            for (var key in objectStore.data) {
                this._keys.push(key);
            }

            this.continue();
        }
    }

    export class InMemoryDatabase {
        public _objectStores = {};

        public open(name: string, version: number): InMemoryRequest {
            return new InMemoryRequest(this);
        }

        public createStoreObject(name: string, def: { keyPath: string }): void {
            this._objectStores[name] = new InMemoryStoreObject(def.keyPath);
        }

        public transaction(name: string): InMemoryTransaction {
            return new InMemoryTransaction(this);
        }
    }
} 