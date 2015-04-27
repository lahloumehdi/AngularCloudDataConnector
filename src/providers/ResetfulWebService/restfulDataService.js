/// <reference path="../../../lib/jquery/jquery.d.ts" />
/// <reference path="../../../dist/cdc.d.ts" />
var CloudDataConnector;
(function (CloudDataConnector) {
    var RestfulDataService = (function () {
        function RestfulDataService() {
        }
        RestfulDataService.prototype.initSource = function (servicePath, accessPaths) {
            //TODO: Implement OAuth
            //restSvc.config.credentials = undefined;
            var _this = this;
            if (servicePath.substring(servicePath.length - 1) !== "/") {
                servicePath += "/";
            }
            this.servicePath = servicePath;
            this.tableNames = new Array();
            this.keyNames = {};
            $.each(accessPaths, function (i, path) {
                if (path.objectName.substring(0, 1) === "/") {
                    path.objectName = path.substring(1);
                }
                _this.tableNames.push(path.objectName);
                _this.keyNames[path.objectName] = path.keyProperyName;
            });
        };

        RestfulDataService.prototype.add = function (tableName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            $.ajax({
                type: "POST",
                url: this.servicePath + tableName,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true,
                data: JSON.stringify(entity)
            }).done(function () {
                onsuccess(entity);
            }).fail(function () {
                onerror("http error");
            });
        };
        RestfulDataService.prototype.update = function (tableName, entity, onsuccess, onerror) {
            delete entity.$$hashKey;
            var eid = entity.id;
            if (this.keyNames[tableName] !== "id")
                delete entity.id;

            $.ajax({
                type: "PUT",
                url: this.servicePath + tableName + "/" + eid,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true,
                data: JSON.stringify(entity)
            }).done(function () {
                onsuccess(entity);
            }).fail(function () {
                onerror("update data failed");
            });
        };
        RestfulDataService.prototype.remove = function (tableName, entity, onsuccess, onerror) {
            $.ajax({
                type: "DELETE",
                url: this.servicePath + tableName + "/" + entity.id,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true
            }).done(function (result) {
                onsuccess();
            }).fail(function () {
                onerror("delete object failed.");
            });
        };
        RestfulDataService.prototype.get = function (updateCallback, lastSyncDates) {
            var _this = this;
            $.each(this.tableNames, function (i, table) {
                var lastSyncDate = lastSyncDates[table];

                _this._getTable(table, function (resultElement) {
                    updateCallback([resultElement]);
                }, lastSyncDate);
            });
        };
        RestfulDataService.prototype._getTable = function (tableName, callback, lastDate) {
            var _this = this;
            $.ajax({
                type: "GET",
                url: this.servicePath + tableName,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                dataType: "json",
                async: true
            }).done(function (result) {
                for (var i = 0; i < result.length; i++) {
                    // id must needed for Index DB.
                    // most C# cases, id stored as "Id"
                    if (result[i].id == undefined)
                        result[i].id = result[i][_this.keyNames[tableName]];
                }
                var rs = { 'tableName': tableName, 'table': result };
                callback(rs);
            }).fail(function () {
                console.log("get data failed.");
            });
        };
        return RestfulDataService;
    })();
    CloudDataConnector.RestfulDataService = RestfulDataService;
})(CloudDataConnector || (CloudDataConnector = {}));
//# sourceMappingURL=restfulDataService.js.map
