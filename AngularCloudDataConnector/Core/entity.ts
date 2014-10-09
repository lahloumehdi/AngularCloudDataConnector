/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

module AngularCloudDataConnector {
    export interface IEntity {
        id: string;
        sync_deleted: boolean;
        sync_updated: Date;
    }

    export interface IControlledEntity {
        entity: IEntity;
        isDirty: boolean;
        dataService: IDataService;
        tableName: string;
        isNew: boolean;
        isDeleted: boolean;
        enumerablePropertyCount: number;
    }
} 