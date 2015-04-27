/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="azuretablestorageservices.ts" />
// Angular
var angularCDCAzureTableStorageServices = new CloudDataConnector.AzureTableStorageService();
angular.module('AngularCDC.AzureTableStorageServices', []).value('angularCDCAzureTableStorageServices', angularCDCAzureTableStorageServices);
//# sourceMappingURL=AzureTableStorageServicesForAngular.js.map
