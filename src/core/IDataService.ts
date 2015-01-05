/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />

module AngularCloudDataConnector {
    export interface IDataService {
        _dataId: number;
        tableNames: Array<string>;

        add(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        update(tableName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        get(updateCallback: (result: any) => void, lastSyncDates: { [tableName: string]: Date; }): void;
        remove(tableName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
    }
} 