/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="azuredataservice.ts" />
// Angular
var angularCDCAzureMobileService = new CloudDataConnector.AzureDataService();
angular.module('AngularCDC.AzureMobileServices', []).value('angularCDCAzureMobileService', angularCDCAzureMobileService);
//# sourceMappingURL=azureDataServiceForAngular.js.map
