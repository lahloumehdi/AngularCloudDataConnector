declare var CryptoJS;

class AzureStorageTableApi {

    private secretKey: string;
    private accountName: string;

    constructor(secretKey: string, accountName: string) {
        this.secretKey = secretKey;
        this.accountName = accountName;
        if (!CryptoJS || !CryptoJS.enc || !CryptoJS.HmacSHA256 || !CryptoJS.enc.Base64 || !CryptoJS.enc.Utf8) {
            throw "CryptoJS is required";
        }
    }

    private getSignature(stringToSign: string): string {
        return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(CryptoJS.enc.Utf8.parse(stringToSign), CryptoJS.enc.Base64.parse(this.secretKey)));
    }

    private setHeaders(path: string) {
        var headers = {};
        var date = (new Date()).toUTCString();
        var stringToSign = date + "\n" + "/" + this.accountName + "/" + path;
        headers['Authorization'] = "SharedKeyLite " + this.accountName + ":" + this.getSignature(stringToSign);
        headers['x-ms-date'] = date;
        headers['x-ms-version'] = '2014-02-14';
        headers['Accept'] = 'application/json;odata=nometadata';
        headers['DataServiceVersion'] = '3.0;NetFx';
        headers['MaxDataServiceVersion'] = '3.0;NetFx';
        return headers;
    }

    private performRequest(request: any, callback: (result: any) => void, error: (result: any) => void) {
        var headers = request.headers || {},
            url = request.url.replace(/#.*$/, ""), // Strip hash part of URL for consistency across browsers
            httpMethod = request.type ? request.type.toUpperCase() : "GET",
            xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    try {
                        var data = JSON.parse(xhr.responseText)
                            callback(data);
                    }
                    catch (e) {
                        callback(null);
                    }
                }
                else {
                    error(xhr);
                }
            }
        };

        xhr.open(httpMethod, url);

        for (var key in headers) {
            if (request.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, request.headers[key]);
            }
        }

        xhr.send(request.data);
    }
    getTable(tableName: string, callback: (result: any) => void) {
        var that = this;
        var path = "Tables('" + tableName + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req,
            function (data) {
                that.getListItemsInTable(tableName, tableName, callback);
            }, function error(xhr) {
                if (xhr && xhr.status === 404) {
                    var path = "Tables()";
                    var urlPath = "https://" + that.accountName + ".table.core.windows.net/" + path;
                    var jsondata = '{"TableName":"' + tableName + '"}';
                    var req = { url: urlPath, type: "POST", headers: that.setHeaders(path), data: jsondata };
                    req.headers['Content-Length'] = jsondata.length + "";
                    req.headers['Content-Type'] = "application/json";
                    that.performRequest(req, function () {
                        that.getListItemsInTable(tableName, tableName, callback);
                    }, function (xhr) {
                            console.log(xhr);
                    });
                }
            });
    }

    getListItemsInTable(tableName: string, partitionKey: string, callback: (result: any) => void) {
        var that = this;
        var path = tableName;
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath + encodeURI("?$filter=PartitionKey eq '" + partitionKey + "'"), type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req,
            function (data) {
                callback(data.value);
            }, function error(xhr) {
                callback([]);
                console.log(xhr);
            });

    }

    insertEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void) {
        var that = this;
        var path = tableName + '()';
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        if (!data.PartitionKey || !data.RowKey) {
            throw "PartitionKey and RowKey is required";
        }
        var jsondata = JSON.stringify(data);

        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "POST", headers: that.setHeaders(path), data: jsondata };
        req.headers['Content-Length'] = jsondata.length + "";
        req.headers['Content-Type'] = "application/json";
        that.performRequest(req,
            function (data) {
                callback(data);
            }, function error(xhr) {
                console.log(xhr);
                errorCallback(xhr);
            });
    }

    updateEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void) {
        var that = this;
        var path = tableName + "(PartitionKey='" + data.PartitionKey + "',RowKey='" + data.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        delete data.RowKey;
        delete data.PartitionKey;
        var jsondata = JSON.stringify(data);

        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path), data: jsondata };
        that.performRequest(req,
            function (data) {
                var urlPath = "https://" + that.accountName + ".table.core.windows.net/" + path;
                var req = { url: urlPath, type: "PUT", headers: that.setHeaders(path), data: jsondata };
                req.headers['If-Match'] = "W/\"datetime'" + encodeURIComponent(data.Timestamp) + "'\"";
                req.headers['Content-Type'] = "application/json";
                that.performRequest(req, function (data) {
                    callback(data);
                }, function error(xhr) {
                        console.log(xhr);
                        errorCallback(xhr);
                    })
            }
            , function error(xhr) {
                console.log(xhr);
                errorCallback(xhr);
            });
    }


    deleteEntity(tableName: string, entity: any, callback: (result: any) => void, errorCallback: (result: any) => void) {
        var that = this;
        var path = tableName + "(PartitionKey='" + entity.PartitionKey + "',RowKey='" + entity.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        var req = { url: urlPath, type: "GET", headers: that.setHeaders(path) };
        that.performRequest(req,
            function (data) {
                var req = { url: urlPath, type: "DELETE", headers: that.setHeaders(path) };
                req.headers['If-Match'] = "W/\"datetime'" + encodeURIComponent(data.Timestamp) + "'\"";
                that.performRequest(req, function (data) {
                    callback(data);
                }, function error(xhr) {
                        console.log(xhr);
                        errorCallback(xhr);
                    })
            }
            , function error(xhr) {
                console.log(xhr);
                errorCallback(xhr);
            });
    }

};