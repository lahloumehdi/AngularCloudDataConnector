﻿/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */ 

/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
 
module CloudDataConnector {
    export interface ICommand {
        entity: IEntity;
        tableName: string;
        order: string;
    }
}   