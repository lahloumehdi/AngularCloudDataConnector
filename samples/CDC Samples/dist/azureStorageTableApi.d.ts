declare var CryptoJS: any;
declare class AzureStorageTableApi {
    private secretKey;
    private accountName;
    constructor(secretKey: string, accountName: string);
    private getSignature(stringToSign);
    private setHeaders(path);
    private performRequest(request, callback, error);
    getTable(tableName: string, callback: (result: any) => void): void;
    getListItemsInTable(tableName: string, partitionKey: string, callback: (result: any) => void): void;
    insertEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
    updateEntity(tableName: string, data: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
    deleteEntity(tableName: string, entity: any, callback: (result: any) => void, errorCallback: (result: any) => void): void;
}
