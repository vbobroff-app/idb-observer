# idb-observer
Observable typescript client library for IndexedDB with API like some documents DB. RxJs v^7 should be install in dependeces.
## how to install
  with npm:
```sh
npm i idb-observer
```
  with yarn:

```sh
yarn add idb-observer
```

## how it works
This package introduces two classes for IndexedDb. There are **IdClient** and **IdbApi** in it. 
**IdClient** for initialise DB and **IdbApi** to manipulate entities in it.
## new client
**IdClient** includes follow methods:
* .init() - to initialize and get db object,
* .upgrade() - whеn needs upgrade version.
Somthing like this helps: 

```sh
import IdbClient, { IdbApi } from 'idb-observer';
...
const client = new IdbClient('test');
const idbApi = new IdbApi();
const collection = 'posts'; //for example
client.init().subscribe((db)=> { idbApi.init(db, collection); });
```

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


