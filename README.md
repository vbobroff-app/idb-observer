# idb-observer
Rxjs Observable typescript client library for IndexedDB with API like some documents DB.
## how to install
## how it Works
## new client
## api methods

* .create
* .list
* .get
* .update
* .remove

## sample

|API method|Parameters|result|
|---       |---       |---   |
|.create\<T\>| (doc: T, key?: IDBValidKey, collection?: string) | Observable\<string \| undefined\> |
|.list\<T\>       | (query?: IDBKeyRange, collection?: string)  | Observable<T[]>|
|.get\<T\>       | (query: IDBValidKey \| IDBKeyRange, collection?: string)  | Observable\<T \| T[] \| null\>|
|.update\<T\>      | (key?: string \| number, data?: {}, collection?: string) | Observable\<IDBValidKey \| null\>|
|.remove      | (key: string \| number, collection?: string)  | Observable\<void\>|


