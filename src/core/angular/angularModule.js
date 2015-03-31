/// <reference path="../connectivityservice.ts" />
/// <reference path="../database.ts" />
/// <reference path="../offlineservice.ts" />

// Angular
var dataModule = angular.module('AngularCDC', ['AngularCDC.OfflineModule', 'AngularCDC.ConnectivityModule']);

dataModule.factory('angularCDCService', [
    'angularCDCOfflineService', 'angularCDCConnectivityService', function (angularCDCOfflineService, angularCDCConnectivityService) {
        return new AngularCloudDataConnector.DataService(angularCDCOfflineService, angularCDCConnectivityService);
    }]);

var connectivityModule = angular.module('AngularCDC.ConnectivityModule', []);

connectivityModule.service('angularCDCConnectivityService', function () {
    return new AngularCloudDataConnector.ConnectivityService();
});

var dataModule = angular.module('AngularCDC.OfflineModule', []);

dataModule.factory('angularCDCOfflineService', function () {
    return new AngularCloudDataConnector.OfflineService();
});
//# sourceMappingURL=angularModule.js.map
