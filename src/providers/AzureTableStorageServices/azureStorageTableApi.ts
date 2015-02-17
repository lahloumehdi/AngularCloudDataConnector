declare var CryptoJS;
interface JQueryStatic {
    ajax(settings: any);
}
declare var jQuery: JQueryStatic;

class AzureStorageTableApi {

    private secretKey: string;
    private accountName: string;

    constructor(secretKey: string, accountName: string) {
        this.secretKey = secretKey;
        this.accountName = accountName;
        if (!jQuery || !jQuery.ajax) {
            throw "JQuery is required";
        }
        if (!CryptoJS || !CryptoJS.enc || !CryptoJS.HmacSHA256 || !CryptoJS.enc.Base64 || !CryptoJS.enc.Utf8) {
            throw "CryptoJS is required";
        }
    }

    private getSignature(stringToSign: string): string {
        return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(CryptoJS.enc.Utf8.parse(stringToSign), CryptoJS.enc.Base64.parse(this.secretKey)));
    }


    private xhrParams(xhr: any, path: string): any {
        var date = (<any>new Date()).toUTCString();
        var stringToSign = date + "\n" + "/" + this.accountName + "/" + path;
        xhr.setRequestHeader('Authorization', "SharedKeyLite " + this.accountName + ":" + this.getSignature(stringToSign));
        xhr.setRequestHeader('x-ms-date', date);
        xhr.setRequestHeader('x-ms-version', '2014-02-14');
        xhr.setRequestHeader('Accept', 'application/json;odata=nometadata');
        xhr.setRequestHeader('DataServiceVersion', '3.0;NetFx');
        xhr.setRequestHeader('MaxDataServiceVersion', '3.0;NetFx');
        return xhr;
    }

    getTable(tableName: string, callback: (result: any) => void) {
        var that = this;
        var path = "Tables('" + tableName + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        jQuery.ajax({
            url: urlPath,
            type: 'GET',
            success: function (data) {
                that.getListItemsInTable(tableName, tableName, callback)
                //do something to data
            },
            beforeSend: function (xhr) {
                xhr = that.xhrParams(xhr, path);
            },
            error: function (rcvData) {
                console.log(rcvData);
            }
        });
    }

    getListItemsInTable(tableName: string, partitionKey: string, callback: (result: any) => void) {
        var that = this;
        var path = tableName;
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        jQuery.ajax({
            url: urlPath + encodeURI("?$filter=PartitionKey eq '" + partitionKey + "'"),
            type: 'GET',
            success(data) {
                callback(data.value);
                //do something to data
            },
            beforeSend(xhr) {
                xhr = that.xhrParams(xhr, path);
            },
            error(rcvData) {
                callback([]);
                console.log(rcvData);
            }
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
        jQuery.ajax({
            url: urlPath ,
            type: 'POST',
            data: jsondata,
            success(data) {
                callback(data);
            },
            beforeSend(xhr) {
                xhr = that.xhrParams(xhr, path);
                xhr.setRequestHeader('Content-Length', jsondata.length + "");
                xhr.setRequestHeader('Content-Type', "application/json");
            },
            error(rcvData) {
                console.log(rcvData);
                errorCallback(rcvData);
            }
        });
    }

    updateEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void) {
        var that = this;
        var path = tableName + "(PartitionKey='" + data.PartitionKey + "',RowKey='" + data.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        delete data.RowKey;
        delete data.PartitionKey;
        var jsondata = JSON.stringify(data);
        jQuery.ajax({
            url: urlPath,
            type: 'GET',
            data: jsondata,
            success(d) {
                jQuery.ajax({
                    url: urlPath,
                    type: 'PUT',
                    data: jsondata,
                    success(data) {
                        callback(data);
                    },
                    beforeSend(xhr) {
                        xhr = that.xhrParams(xhr, path);
                        xhr.setRequestHeader('If-Match', "W/\"datetime'" + encodeURIComponent(d.Timestamp) + "'\"");
                        xhr.setRequestHeader('Content-Type', "application/json");
                    },
                    error(rcvData) {
                        console.log(rcvData);
                        errorCallback(rcvData);
                    }
                });
            },
            beforeSend(xhr) {
                xhr = that.xhrParams(xhr, path);
            },
            error(rcvData) {
                console.log(rcvData);
                errorCallback(rcvData);
            }
        });
    }


    deleteEntity(tableName: string, entity: any, callback: (result: any) => void, errorCallback: (result: any) => void) {
        var that = this;
        var path = tableName + "(PartitionKey='" + entity.PartitionKey + "',RowKey='" + entity.RowKey + "')";
        var urlPath = "https://" + this.accountName + ".table.core.windows.net/" + path;
        jQuery.ajax({
            url: urlPath,
            type: 'GET',
            success(d) {
                jQuery.ajax({
                    url: urlPath,
                    type: 'DELETE',
                    success(data) {
                        callback(data);
                    },
                    beforeSend(xhr) {
                        xhr = that.xhrParams(xhr, path);
                        xhr.setRequestHeader('If-Match', "W/\"datetime'" + encodeURIComponent(d.Timestamp) + "'\"");
                    },
                    error(rcvData) {
                        console.log(rcvData);
                        errorCallback(rcvData);
                    }
                });
            },
            beforeSend(xhr) {
                xhr = that.xhrParams(xhr, path);
            },
            error(rcvData) {
                errorCallback(rcvData);
                console.log(rcvData);
            }
        });
    }

};