/* Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.  Licensed under the Apache License, Version 2.0.  See License.txt in the project root for license information. */

'use strict';

/* Controllers */
function computedProperty($scope, computedPropertyName, dependentProperties, f) {
    function assignComputedProp($scope) {
        var computedVal = f($scope);
        $scope[computedPropertyName] = computedVal;
    };

    $scope.$watchCollection(dependentProperties, function (newVal, oldVal, $scope) {
        assignComputedProp($scope);
    });
    assignComputedProp($scope);
};

angular.module('testAODataFx.controllers', ['DataModule', 'AzureDataModule', 'ConnectivityModule']).
    controller('pageController', ['$scope', 'dataService', 'azureDataService', 'connectivityService',
        function ($scope, dataService, azureDataService, connectivityService) {
            $scope.errorMessage = "";
            $scope.sortOrder = {
                "properties": "address"
            };
            $scope.onlineStatus = connectivityService.getStatus();
            computedProperty($scope, 'onlineStatus', connectivityService.getStatus, function (scope) {
                return connectivityService.getStatus();
            });

            $scope.sync = function () {
                $scope.$apply($scope.errorMessage = 'Loading...');
                dataService.getEntries(function (results) {
                    // Update view         
                    $scope.errorMessage = '';
                    for (var result in results) {
                        $scope.$apply($scope[result] = results[result]);
                    }
                });
            };

            $scope.updateOnlineStatus = function () {
                $scope.$apply(connectivityService.setStatus($scope.onlineStatus));
                $scope.sync();
            };

            $scope.data = {
                add: function (tableName, values) {
                    var entity = {};
                    if (values) {
                        entity = values;
                    }
                    dataService.add(tableName, entity, function () {
                        $scope.sync();
                    }, function () {
                        $scope.errorMessage = "Error while creating entity...";
                    })
                },

                delete: function (tableName, entity) {
                    dataService.remove(tableName, entity, function () {
                        $scope.sync();
                    }, function () {
                        $scope.errorMessage = "Error while deleting entity...";
                    });
                }
            };

            azureDataService.addSource('https://landcestry.azure-mobile.net/', 'lVtnUKTQgcgKLlhOYJBzmPROlPlXbT24',
                ['Properties_Test', 'PropertyRecords_Test']);
            dataService.addSource(azureDataService);

            dataService.connect(function (results) {
                for (var result in results) {
                    $scope.$apply($scope[result] = results[result]);
                }
            });
        }]);
