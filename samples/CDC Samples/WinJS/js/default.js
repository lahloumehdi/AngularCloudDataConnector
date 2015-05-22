// For an introduction to the Navigation template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392287
(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    var sched = WinJS.Utilities.Scheduler;
    var ui = WinJS.UI;
    var page = this;
    app.addEventListener("activated", function (args) {
        nav.history = app.sessionState.history || {};
        nav.history.current.initialPlaceholder = true;


        WinJS.Namespace.define("model", {
            ContactList: new WinJS.Binding.List(),
        });


        // Optimize the load of the application and while the splash screen is shown, execute high priority scheduled work.
        var p = ui.processAll().then(function () {
            var listview = document.getElementById('listview').winControl;
            var addbtn = document.getElementById('add');
            var changebtn = document.getElementById('change');
            var deletebtn = document.getElementById('delete');
            var firstname = document.getElementById('firstname');
            var lastname = document.getElementById('lastname');
            var currentdata = {};
            var adress = document.getElementById('adress');
            var initstateBtn = function () {
                lastname.value = "";
                adress.value = "";
                firstname.value = "";
                currentdata = {};
                addbtn.innerHTML = "add";
                deletebtn.classList.add('hide');
                changebtn.classList.add('hide');
            }
            var add = function () {
                if (addbtn.innerHTML == "cancel") {
                    initstateBtn();
                    return;
                }
                CDCService.add("people",
                    { "firstname": firstname.value, "lastname": lastname.value, "address1": adress.value, "sync_updated": (new Date()).toJSON(), "sync_deleted": false, "address": null, "homephone": null, "email": null, "imageurl": null, "facebookurl": null, "instagramurl": null });
                CDCService.commit(function () {
                    // Things went well, call a sync  (is not necessary if you added the scope to connect function of CDCService)
                    //$scope.sync();
                }, function (e) {
                    console.log('Problem adding data');
                });
                initstateBtn();
            }
            addbtn.onclick = add;
            deletebtn.onclick = function () {
                CDCService.remove("people", currentdata.data);
                initstateBtn();
                CDCService.commit(function () {
                    // Things went well, call a sync (is not necessary if you added the scope to connect function of CDCService)
                    // $scope.sync();
                }, function (err) {
                    console.log('Problem deleting data: ' + err.message);
                });
            };
            var dataContext = {};
            changebtn.onclick = function () {
                dataContext['people'][currentdata.index].firstname = firstname.value
                dataContext['people'][currentdata.index].lastname = lastname.value
                dataContext['people'][currentdata.index].address1 = adress.value
                dataContext['people'][currentdata.index].isDirty = true;

                // entity is already controlled, we just need to call a commit
                CDCService.commit(function () {
                }, function (err) {
                    console.log('Problem updating data: ' + err.message);
                });
                initstateBtn();
            }
            listview.oniteminvoked = function (args) {
                args.detail.itemPromise.then(function (data) {
                    firstname.value = data.data.firstname;
                    lastname.value = data.data.lastname;
                    adress.value = data.data.adress;
                    currentdata = { data: data.data.data, index: data.index };
                    addbtn.innerHTML = "cancel";
                    deletebtn.classList.remove('hide');
                    changebtn.classList.remove('hide');
                });
            }
            var CDCAzureMobileService = new CloudDataConnector.AzureDataService();
            var CDCService = new CloudDataConnector.DataService(new CloudDataConnector.OfflineService(), new CloudDataConnector.ConnectivityService());
            CDCAzureMobileService.addSource('https://angularpeoplev2.azure-mobile.net/', // appUrl
                'DDJpBYxoQEUznagCnyYNRYfkDxpYyz90',  // appKey
                 ['people']);      // table name
            CDCService.addSource(CDCAzureMobileService);

            var onUpdateDataContext = function (data) {
                if (data && data.length) {
                    if (model.ContactList.length > 0) {
                        model.ContactList.splice(0, model.ContactList.length);
                    }
                    for (var i = 0; i < data.length; i++) {
                        model.ContactList.push(WinJS.Binding.as({ data: data[i], firstname: data[i].firstname, lastname: data[i].lastname, adress: data[i].address1 }));
                    }
                }
            }

            CDCService.connect(function (results) {
                if (results === false) {
                    throw "CDCService must first be successfully initialized";
                }
                else {
                    // We are good to go
                    var test = "";
                }
            }, dataContext, onUpdateDataContext, 3);
        });

        args.setPromise(p);
    });

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    app.start();
})();
