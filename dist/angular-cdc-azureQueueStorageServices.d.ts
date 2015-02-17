/// <reference path="../lib/angularjs/angular.d.ts" />
/// <reference path="../lib/jquery/jquery.d.ts" />
/// <reference path="angular-cdc.d.ts" />
declare var CryptoJS: any;
interface JQueryStatic {
    ajax(settings: any): any;
}
declare var jQuery: JQueryStatic;
declare module AzureStorageAPI {
    class AzureStorageQueueApi {
        private secretKey;
        private accountName;
        constructor(secretKey: string, accountName: string);
        private getSignature(stringToSign);
        private xmlToJson(xml);
        private guid();
        private buildCanonicalizedResource(ressources);
        private xhrParams(xhr, path, VERB, ressources, contentLength, contentType);
        private newQueue(queueName, callback);
        getQueue(queueName: string, callback: (result: any) => void): void;
        getListItemsInQueue(queueName: string, callback: (result: any) => void): void;
        insertEntity(queueName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
        updateEntity(queueName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
        deleteEntity(queueName: string, entity: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
    }
}
declare module AngularCloudDataConnector {
    class AzureQueueStorageService implements IDataService {
        azureClient: AzureStorageAPI.AzureStorageQueueApi;
        dataAvailableCallback: (any: any) => void;
        tableNames: string[];
        _dataId: number;
        _lastSyncDate: Date;
        addSource(accountName: any, secretKey: string, queueNames: any): void;
        get(updateCallback: (result: any) => void, lastSyncDates: any): void;
        private _getTable(queueName, callback, lastDate);
        remove(queueName: string, entity: any, onsuccess: () => void, onerror: (error: string) => void): void;
        update(queueName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
        add(queueName: string, entity: any, onsuccess: (newEntity: any) => void, onerror: (error: string) => void): void;
    }
}
declare var angularCDCAzureQueueStorageServices: AngularCloudDataConnector.AzureQueueStorageService;
