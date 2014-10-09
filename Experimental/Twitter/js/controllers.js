'use strict';

/* Controllers */
angular.module('testTwitter.controllers', ['DataModule', 'TwitterDataModule']).
    controller('pageController', ['$scope', 'dataService', 'twitterDataService',
        function ($scope, dataService, twitterDataService) {
            $scope.errorMessage = "";
            $scope.errorMessage = 'Loading...';
            $scope.hashTags = "babylonjs";

            $scope.sync = function () {

                twitterDataService.HashTag = $scope.hashTags;

                $scope.errorMessage = 'Loading...';

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

            dataService.addSource(twitterDataService);

            dataService.connect(function (results) {
                for (var result in results) {
                    $scope.$apply($scope[result] = results[result]);
                }
                $scope.errorMessage = '';
            }, null, 2);
        }]);
