/// <reference path="../../../lib/angularjs/angular.d.ts" />
/// <reference path="couchdb.ts" />


// Angular
var angularCDCCouchDB = new CloudDataConnector.couchDBDataService();
angular.module('AngularCDC.CouchDB', []).value('angularCDCCouchDB', angularCDCCouchDB);
