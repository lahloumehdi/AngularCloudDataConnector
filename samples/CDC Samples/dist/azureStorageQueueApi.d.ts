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
