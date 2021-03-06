﻿// Angular
var dataModule = angular.module('AngularCDC', ['AngularCDC.OfflineModule', 'AngularCDC.ConnectivityModule']);

dataModule.factory('angularCDCService', [
    'angularCDCOfflineService', 'angularCDCConnectivityService', function (angularCDCOfflineService, angularCDCConnectivityService) {
        return new AngularCloudDataConnector.DataService(angularCDCOfflineService, angularCDCConnectivityService);
    }]);

// Angular
var connectivityModule = angular.module('AngularCDC.ConnectivityModule', []);

connectivityModule.service('angularCDCConnectivityService', function () {
    return new AngularCloudDataConnector.ConnectivityService();
});

// Angular
var dataModule = angular.module('AngularCDC.OfflineModule', []);

dataModule.factory('angularCDCOfflineService', function () {
    return new AngularCloudDataConnector.OfflineService();
});
//# sourceMappingURL=angularModule.js.map
