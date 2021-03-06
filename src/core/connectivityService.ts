﻿/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

/// <reference path="../../lib/angularjs/angular.d.ts" />
/// <reference path="../../lib/jquery/jquery.d.ts" />
var __global = this;

module CloudDataConnector {
    export class ConnectivityService {
        // Statics
        private static _NotDefinedStatus = "not defined";
        private static _OnlineStatus = "online";
        private static _LocalStatus = "online";

        public static get OnlineStatus(): string {
            return ConnectivityService._OnlineStatus;
        }

        public static get LocalStatus(): string {
            return ConnectivityService._LocalStatus;
        }

        public static get NotDefinedStatus(): string {
            return ConnectivityService._NotDefinedStatus;
        }

        // Members
        onlineStatus = ConnectivityService.NotDefinedStatus;
        statusChangeFns = new Array<() => void>();

        // Methods
        public addStatusChangeNotify(notifyFn: () => void): void {
            this.statusChangeFns.push(notifyFn);
        }

        public getStatus(): string {
            if (this.onlineStatus === ConnectivityService.NotDefinedStatus) {
                this.resetStatus();
            }
            return this.onlineStatus;
        }

        private setStatus(value: string) {
            var notifyChange = value != this.onlineStatus;
            this.onlineStatus = value;
            if (notifyChange) {
                this.statusChangeFns.forEach((fn, index) => {
                    fn();
                });
            }
        }

        private resetStatus(): void {

            if (!__global.navigator) {
                this.setStatus(ConnectivityService.OnlineStatus);
            }
            else {
                this.setStatus(navigator.onLine ? ConnectivityService.OnlineStatus : ConnectivityService.LocalStatus);
            }
            if (__global.addEventListener) {
                __global.addEventListener("online", () => {
                    this.setStatus(ConnectivityService.OnlineStatus);
                }, true);
                __global.addEventListener("offline", () => {
                    this.setStatus(ConnectivityService.LocalStatus);
                }, true);
            }
        }

        public isOnline(): boolean {
            return this.getStatus() === ConnectivityService.OnlineStatus;
        }
    }
}

