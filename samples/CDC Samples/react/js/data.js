var peopleService = (function () {
    var dataContext = {}
    var angularCDCAzureMobileService = new CloudDataConnector.AzureDataService();
    var CDCService = new CloudDataConnector.DataService(new CloudDataConnector.OfflineService(), new CloudDataConnector.ConnectivityService());
    angularCDCAzureMobileService.addSource('https://angularpeoplev2.azure-mobile.net/', // appUrl
        'DDJpBYxoQEUznagCnyYNRYfkDxpYyz90',  // appKey
         ['people']);      // table name
    CDCService.addSource(angularCDCAzureMobileService);
    var list = [];
    var onUpdateDataContext = function (data) {
        if (data && data.length) {
            if (list.length > 0) {
                list = [];
            }
            for (var i = 0; i < data.length; i++) {
                list.push({ data: data[i], index: i });
            }
        }
    }


    var findById = function (id) {
        var deferred = $.Deferred();
        var employee = null;
        var l = list.length;
        for (var i = 0; i < l; i++) {
            if (list[i].id == id) {
                employee = list[i];
                break;
            }
        }
        deferred.resolve(employee);
        return deferred.promise();
    }, connect = function () {
        var deferred = $.Deferred();
        CDCService.connect(function (results) {
            if (results === false) {
                throw "CDCService must first be successfully initialized";
            }
            else {
                // We are good to go
                var test = "";
            }
            deferred.resolve(list);
        }, dataContext, onUpdateDataContext, 3);

        return deferred.promise();
    }, add = function (firstname, lastname, address1) {
        var deferred = $.Deferred();
        CDCService.add("people",
                    { "firstname": firstname, "lastname": lastname, "address1": address1, "sync_updated": (new Date()).toJSON(), "sync_deleted": false, "address": null, "homephone": null, "email": null, "imageurl": null, "facebookurl": null, "instagramurl": null });
        CDCService.commit(function () {
            // Things went well, call a sync  (is not necessary if you added the scope to connect function of CDCService)
            //$scope.sync();
            deferred.resolve(list);
        }, function (e) {
            deferred.resolve(list);
            console.log('Problem adding data');
        });
        return deferred.promise();
    },
    remove = function (item) {
        var deferred = $.Deferred();
        CDCService.remove("people", item.data);
        CDCService.commit(function () {
            deferred.resolve(list);
        }, function (err) {
            deferred.resolve(list);
            console.log('Problem deleting data: ' + err.message);
        });
        return deferred.promise();

    }, modify = function (firstname, lastname, address1,index) {
        var deferred = $.Deferred();
        dataContext['people'][index].firstname = firstname
        dataContext['people'][index].lastname = lastname
        dataContext['people'][index].address1 = address1
        dataContext['people'][index].isDirty = true;

        // entity is already controlled, we just need to call a commit
        CDCService.commit(function () {
            deferred.resolve(list);
        }, function (err) {
            deferred.resolve(list);
            console.log('Problem updating data: ' + err.message);
        });
        return deferred.promise();

    }

    // The public API
    return {
        findById: findById,
        connect: connect,
        add: add,
        modify: modify,
        remove: remove
    };

}());