var myService = angular.module('ConnectivityModule', []);

myService.service('connectivityService', function () {
    // valid values: online, local, or p2p

    return {
        onlineStatus: '',
        statusChangeFns: [],
        senseStatus: function () {
            var that = this;
            this.setStatus(navigator.onLine ? 'online' : 'local');

            if (window.addEventListener) {
                window.addEventListener("online", function () {
                    that.setStatus('online');
                    $scope.$apply();
                }, true);
                window.addEventListener("offline", function () {
                    that.setStatus('local');
                    $scope.$apply();
                }, true);
            } else {
                document.body.ononline = function () {
                    that.setStatus('online');
                    $scope.$apply();
                };
                document.body.onoffline = function () {
                    that.setStatus('local');
                    $scope.$apply();
                };
            };
        },
        addStatusChangeNotify: function(notifyFn) {
            this.statusChangeFns.push(notifyFn);
        },
        getStatus: function () {
            if (this.onlineStatus == '') {
                this.resetStatus();
            }
            return this.onlineStatus;
        },
        setStatus: function (value) {
            var notifyChange = value != this.onlineStatus;
            this.onlineStatus = value;
            if (notifyChange) {
                angular.forEach(this.statusChangeFns, function (fn, index) {
                    fn();
                });
            }
        },
        resetStatus: function () {
            this.senseStatus();
        },
        isOnline: function() {
            return this.getStatus() == 'online';
        }
    };
});