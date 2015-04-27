/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="restfuldataservice.ts" />
var angularCDCRest = new CloudDataConnector.RestfulDataService();
angular.module('AngularCDC.RestWebServices', []).value('angularCDCRestWebServices', angularCDCRest);
//# sourceMappingURL=restfulDataServiceForAngular.js.map
