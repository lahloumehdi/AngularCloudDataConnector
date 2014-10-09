/// <reference path="../../core/References.d.ts" />
var AngularCloudDataConnector;
(function (AngularCloudDataConnector) {
    var OrdrinService = (function () {
        function OrdrinService(http) {
            this.tableNames = new Array();
            this._serviceUrl = "https://sertactest.azure-mobile.net/api/ordrin";
            this._http = http;
            this.tableNames = ["restaurants"];
        }
        Object.defineProperty(OrdrinService.prototype, "Zip", {
            set: function (value) {
                this._zip = value;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(OrdrinService.prototype, "City", {
            set: function (value) {
                this._city = value;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(OrdrinService.prototype, "Address", {
            set: function (value) {
                this._address = value;
            },
            enumerable: true,
            configurable: true
        });

        OrdrinService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            console.warn("Ordrin provider does not support adding data.");
        };

        OrdrinService.prototype.get = function (callback, lastSyncDate) {
            var request = this._serviceUrl + "?zip= " + this._zip + "&city=" + this._city + "&address=" + this._address;
            var that = this;

            this._http.get(request).success(function (data) {
                if (that._result) {
                    var table = that._result[0].table;
                    for (var index = 0; index < table.length; index++) {
                        if (table[index].deleted) {
                            table.splice(index, 1);
                            index--;
                            continue;
                        }

                        table[index].deleted = true;
                    }

                    that._result[0].table = table.concat(data.statuses);
                } else {
                    that._result = [
                        {
                            tableName: "restaurants",
                            table: data
                        }
                    ];
                }

                callback(that._result);
            });
        };

        OrdrinService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            console.warn("Ordrin provider does not support removing data.");
        };
        return OrdrinService;
    })();
    AngularCloudDataConnector.OrdrinService = OrdrinService;
})(AngularCloudDataConnector || (AngularCloudDataConnector = {}));

// Angular
angular.module('OrdrinDataModule', []).service('ordrinDataService', function ($http) {
    return new AngularCloudDataConnector.OrdrinService($http);
});
//# sourceMappingURL=ordrinDataService.js.map
