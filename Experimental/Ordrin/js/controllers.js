'use strict';

/* Controllers */
angular.module('testOrdrin.controllers', ['DataModule', 'OrdrinDataModule']).
    controller('pageController', ['$scope', 'dataService', 'ordrinDataService',
        function ($scope, dataService, ordrinDataService) {
            $scope.errorMessage = "";

            $scope.sync = function () {

                ordrinDataService.Zip = $scope.zip;
                ordrinDataService.City = $scope.city;
                ordrinDataService.Address = $scope.address;

                $scope.$apply($scope.errorMessage = 'Loading...');

                dataService.sync(function () {
                    dataService.readAll(function (results) {
                        // Update view         
                        $scope.errorMessage = '';
                        for (var result in results) {
                            $scope.$apply($scope[result] = results[result]);
                        }
                    });
                });

            };

            dataService.addSource(ordrinDataService);

            dataService.connect(function (results) {
                for (var result in results) {
                    $scope.$apply($scope[result] = results[result]);
                }
            });
        }]);
