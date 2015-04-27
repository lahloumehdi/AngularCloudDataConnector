/// <reference path="../connectivityservice.ts" />
/// <reference path="../database.ts" />
/// <reference path="../offlineservice.ts" />

// Angular
var dataModule = angular.module('CDC', ['CDC.OfflineModule', 'CDC.ConnectivityModule']);

dataModule.factory('CDCService', [
    'CDCOfflineService', 'CDCConnectivityService', function (CDCOfflineService, CDCConnectivityService) {
        return new CloudDataConnector.DataService(CDCOfflineService, CDCConnectivityService);
    }]);

var connectivityModule = angular.module('CDC.ConnectivityModule', []);

connectivityModule.service('CDCConnectivityService', function () {
    return new CloudDataConnector.ConnectivityService();
});

var dataModule = angular.module('CDC.OfflineModule', []);

dataModule.factory('CDCOfflineService', function () {
    return new CloudDataConnector.OfflineService();
});
//# sourceMappingURL=angularModule.js.map
