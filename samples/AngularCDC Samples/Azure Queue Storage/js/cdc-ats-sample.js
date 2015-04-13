var app = angular.module('demoApp', ['ngAnimate', 'CDC', 'AngularCDC.AzureQueueStorageServices', 'ui.bootstrap']);
app.controller('demoController', ['$scope', 'CDCService', 'angularCDCAzureQueueStorageServices', '$modal',
    function ($scope, CDCService, angularCDCAzureQueueStorageServices, $modal) {
        //define global scope variables
        $scope.sortField = 'firstname';
        $scope.ascending = true;
        $scope.currentColumn = 0;
        $scope.menu = "main";

        //Delete person
        $scope.Delete = function (tableName, entity) {
            CDCService.remove(tableName, entity);
            CDCService._lastSyncDates[angularCDCAzureQueueStorageServices._dataId][tableName] = null;

            CDCService.commit(function () {
                // Things went well, call a sync (is not necessary if you added the scope to connect function of CDCService)
          //      $scope.sync();
            }, function (err) {
                console.log('Problem deleting data: ' + err.message);
            });

            $scope.menu = "main";
            $scope.currentEdit = {};
        };

        //Add a new person
        $scope.Add = function (tableName, entity) {
            CDCService.add(tableName, entity);
            CDCService._lastSyncDates[angularCDCAzureQueueStorageServices._dataId][tableName] = null;

            CDCService.commit(function () {
                // Things went well, call a sync  (is not necessary if you added the scope to connect function of CDCService)
                // $scope.sync();
            }, function (e) {
                console.log('Problem adding data');
            });

            $scope.menu = "main";
            $scope.currentEdit = {};
        };
        //function to sync the data
        $scope.sync = function () {
            CDCService.readAll();
        };

        //Update entity
        $scope.Change = function (tableName, entity) {
            // entity is already controlled, we just need to call a commit
            CDCService.commit(function () {
                // Things went well, call a sync (is not necessary if you added the scope to connect function of CDCService)
                // $scope.sync();
            }, function (err) {
                console.log('Problem updating data: ' + err.message);
            });
            $scope.menu = "main";
            $scope.currentEdit = {};

        };


        //intialize the connection to Azure Mobile Services, and register provider to AngularCDC
        $scope.initialize = function () {
            angularCDCAzureQueueStorageServices.addSource('testmehdi', // accountName
              'RnomjpHwjX1KkD3Ymd+iZFFfftoIU7H3Xy8OmM04tahF4Ra4eXtQAiy/IdEGINqvXxC58QwNlwbJSEH0FBNyuA==',  // secretKey
                 ['people']);      // table name
            CDCService.addSource(angularCDCAzureQueueStorageServices);
            CDCService.connect(function (results) {
                if (results === false) {
                    throw "CDCService must first be successfully initialized";
                }
                else {
                    // We are good to go
                }
            }, $scope,$scope.$apply, 3);
        };

        //trigger modal dialog 
        $scope.Edit = function (mode, person) {
            console.log(person);

            var modalInstance = $modal.open({
                templateUrl: 'editModalContent.html',
                controller: 'modalController',
                resolve: {
                    mode: function () { return mode; },
                    person: function () {
                        return person;
                    }
                }

            });

            modalInstance.result.then(function (res) {
                if (res.action == 'delete') {
                    $scope.Delete('people', person);
                } else if (res.action == 'update') {
                    $scope.Change('people', person);
                } else if (res.action == 'create') {
                    person.id = Math.random() + '';
                    $scope.Add('people', person);
                }
            }, function () {
                //cancelled
            });
        };

        $scope.watchbuttons = function () {
            $scope.$watch('sortField', function () {
                $scope.ascending = true;
            });

            $scope.$watch(function () {
                return $scope.sortField + $scope.ascending;
            }, function () {
                if ($scope.ascending) {
                    $scope.directionalSort = '+' + $scope.sortField;
                } else {
                    $scope.directionalSort = '-' + $scope.sortField;
                }

            });
        };
        $scope.initialize();
        $scope.watchbuttons();
    }
]);

//controller for modal dialog used to edit people
app.controller('modalController', ['$scope', 'mode', 'person', '$modalInstance',
    function ($scope, mode, person, $modalInstance) {
        $scope.mode = mode;
        $scope.currentEdit = person;

        $scope.create = function () {
            if (!$scope.currentEdit.firstname)
                return;
            $modalInstance.close({ action: 'create', person: $scope.currentEdit });
        };

        $scope.update = function () {
            if (!$scope.currentEdit.firstname)
                return;
            $modalInstance.close({ action: 'update', person: $scope.currentEdit });
        };

        $scope.delete = function () {
            $modalInstance.close({ action: 'delete', person: $scope.currentEdit });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

    }]);

$(window).bind('beforeunload', function () {
    if (indexedDB) {
        indexedDB.deleteDatabase("syncbase");
    }
});