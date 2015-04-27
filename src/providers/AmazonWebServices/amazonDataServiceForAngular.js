/// <reference path="amazondataservice.ts" />
/// <reference path="../../../lib/angularjs/angular.d.ts" />
// Angular
var angularCDCAWS = new CloudDataConnector.AWSDataService();
angular.module('AngularCDC.AWS', []).value('angularCDCAWS', angularCDCAWS);
//# sourceMappingURL=amazonDataServiceForAngular.js.map
