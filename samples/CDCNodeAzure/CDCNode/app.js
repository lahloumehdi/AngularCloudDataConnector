
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var azure = require('azure-storage');
var app = express();
var uuid = require('node-uuid');
var CloudDataConnector = require('cdc');
var entityGen = azure.TableUtilities.entityGenerator;
var tableSvc = azure.createTableService('cdcsamplesstorage', 'TKjI04s1vL3DvgbVFL64RTjEkonDE1g3lkmI+FO2PH7lIDMv7N/sGUrOAzo23m2aBIwYMnw7BFhEfiVU3ctoVA==');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
var that = this;

that.initCDC = function (callback) {
    that.CDCAzureTableStorageService = new CloudDataConnector.AzureTableStorageService();
    that.CDCService = new CloudDataConnector.DataService(new CloudDataConnector.OfflineService(), new CloudDataConnector.ConnectivityService());
    that.CDCAzureTableStorageService.addSource('cdcsamplesstorage', // accountName
              'TKjI04s1vL3DvgbVFL64RTjEkonDE1g3lkmI+FO2PH7lIDMv7N/sGUrOAzo23m2aBIwYMnw7BFhEfiVU3ctoVA==',  // secretKey
                 ['people']);      // table name
    that.CDCService.addSource(that.CDCAzureTableStorageService);
    var post = [];
    var updateIndex;
    var onUpdateDataContext = function (data) {
        if (data && data.length) {
            post = data;
            callback();
        }
        console.log("dsqd");
    }
    that.dataContext = {};
    that.CDCService.connect(function (results) {
        if (results === false) {
            throw "CDCService must first be successfully initialized";
        }
        else {
            // We are good to go
            var test = "";
        }
    }, that.dataContext, onUpdateDataContext, 3);
}
http.createServer(app).listen(app.get('port'), function () {
    app.get('/', function (req, res) {
        //updateIndex = function (data) {
        that.initCDC(function () {
            res.render('index', {
                title: 'people cdc',
                peopleList: that.dataContext.people
            });
        });
          //};
    });
    
    app.get('/ref/:id', function (req, res) {
        //updateIndex = function (data) {
        that.initCDC(function () {
            res.render('index', {
                title: 'peopleList',
                peopleList: that.dataContext.people
            });
        });
          //};
    }); app.post('/people/new', function (req, res) {
        var entity = {
            PartitionKey: entityGen.String('people'),
            RowKey: entityGen.String(uuid()), 
            id: entityGen.String(uuid()), 
            firstname: entityGen.String(req.param('firstname')),
            lastname: entityGen.String(req.param('lastname')),
            address1: entityGen.String(req.param('address1'))
        };
        that.CDCService.add("people", entity);
        that.CDCService._lastSyncDates[that.CDCAzureTableStorageService._dataId]["people"] = null;
        
        that.CDCService.commit(function () {
            res.redirect('/ref/' + Math.floor(Math.random() * 100000));
        }, function (e) {
        });
    });
    app.get('/people/new', function (req, res) {
        res.render('newpeople', {
            title: 'New people'
        });
    });
    app.get('/people/delete/:id', function (req, res) {
        var id = req.params.id;
        var item;
        for (var i = 0; i < that.dataContext['people'].length; i++) {
            if (that.dataContext['people'][i].id === id) {
                item = that.dataContext['people'][i];
                i = that.dataContext['people'].length;
            }
        }
        that.CDCService.remove("people", item);
        that.CDCService.commit(function () {
            res.redirect('/ref/' + Math.floor(Math.random() * 100000));
        }, function (err) {
            console.log('Problem deleting data: ' + err.message);
        });
    })
    app.get('/people/update/:id', function (req, res) {
        var id = req.params.id;
        var item;
        for (var i = 0; i < that.dataContext['people'].length; i++) {
            if (that.dataContext['people'][i].id === id) {
                item = that.dataContext['people'][i];
                i = that.dataContext['people'].length;
            }
        }
        res.render('updatepeople', {
            title: 'update people',
            viewpost: item,
        });
    });
    
    app.post('/people/update/:id', function (req, res) {
        var id = req.params.id;
        for (var i = 0; i < that.dataContext['people'].length; i++) {
            if (that.dataContext['people'][i].id === id) {
                that.dataContext['people'][i].firstname = entityGen.String(req.param('firstname'));
                that.dataContext['people'][i].lastname = entityGen.String(req.param('lastname'));
                that.dataContext['people'][i].address1 = entityGen.String(req.param('address1'));
                i = that.dataContext['people'].length;
            }
        }
        
        that.CDCService.commit(function () {
            res.redirect('/ref/' + Math.floor(Math.random() * 100000));
        }, function (e) {
        });
    });
    console.log('Express server listening on port ' + app.get('port'));
});
