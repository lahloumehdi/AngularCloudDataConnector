/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="azurequeuestorageservices.ts" />
// Angular
var angularCDCAzureQueueStorageServices = new CloudDataConnector.AzureQueueStorageService();
angular.module('AngularCDC.AzureQueueStorageServices', []).value('angularCDCAzureQueueStorageServices', angularCDCAzureQueueStorageServices);
//# sourceMappingURL=azureQueueStorageServicesForAngular.js.map
