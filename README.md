# idb-observer
Observable typescript client library for [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) with API like some documents DB.  
> [!NOTE]
>Peer-dependencies: [RxJs](https://rxjs.dev/) v>6 should be installed.
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
This package introduces two classes for IndexedDb. It contains **IdClient** and **IdbApi**.
The first one, **IdClient** to initialize the DB and **IdbApi** to manipulate entities in it.
## new client
**IdClient** includes follow methods:
* .init() - to initialize and get db object,
* .upgrade() - for the first time and whеn needs upgrade version.  
Somthing like this helps: 

```sh
import IdbClient, { IdbApi } from 'idb-observer';
...
const client = new IdbClient('test');
const idbApi = new IdbApi();
const collection = 'posts'; //for example

client.upgrade().subscribe((db) => {
  if (!db.objectStoreNames.contains(collection)) {
    db.createObjectStore(collection, { keyPath: 'id', autoIncrement: false });
  };
});
client.init().subscribe((db)=> { idbApi.init(db, collection); });
```
> [!TIP]
> Use the upgrade subscription to create objectStore, indexes etc., see [doc](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
> Use the init subscription to get a database instance and pass it to the API object.

## api methods

* .create
* .list
* .get
* .update
* .remove
* .clear

## sample
Create and manipulate the Post object:
```sh
interface Post {
 id?: string;
 text: string;
 title: string;
 description: string;
 author: string;
};
const id = '#111';
const post: Post = {
  id,
  text: 'Test of post',
  title: 'This is Post #111',
  description: 'description',
  author: 'Viktor Bobrofff'
};

idbApi.create<Post>(post).subscribe((id)=>console.log('created', id));
idbApi.update<Post>(id, {author: 'Ivan Ivanov'}).subscribe((id)=>console.log('updated', id));
idbApi.list<Post>().subscribe((posts) => console.log('list', posts));
idbApi.get<Post>(id).subscribe((post)=>console.log('get', post));
idbApi.remove(id).subscribe();
idbApi.clear().subscribe();
```
> [!WARNING]
>Don't forget to unsubsribe!

## safe extract
Since database access methods and api initialization are asynchronous, exceptions are possible.  
Use for safe extract:
* .safe() - safe extract wrapper
* .safeList() - safe list method.

> [!IMPORTANT]
>Using secure extraction, the method will only execute after the api has been initialized. 

If the API is not initialized at the time the method is called, it will waiting for init.  
Opening the DB and executing in different streams:
```sh
const api = new IdbApi();
const events$ = api.safe(()=>api.list<Event>()).pipe(tap((e:Event) => console.log(e)));
const list$ = api.safeList<Event>();
const get$ = api.safe(()=>api.get<Event>('target1'));
   ...
const client = new IdbClient();
client.init().subscribe((db)=>api.init(db, 'events'));
```
Opening the DB and executing in common stream (no safe wraps):

```sh
const client = new IdbClient();
const api = new IdbApi();
  ...
const cash$ = this.client.init.pipe(
  tap((db)=> this.idbApi.init(db, 'events')),
  switchMap(()=>this.idbApi.list<Event>())
)
```


|API method|params|result|
|---       |---       |---   |
|.clear| (collection?: string) | Observable\<void\> |
|.create\<T\>| (doc: T, key?: IDBValidKey, collection?: string) | Observable\<string \| undefined\> |
|.list\<T\>       | (query?: IDBKeyRange, collection?: string)  | Observable<T[]>|
|.get\<T\>       | (query: IDBValidKey \| IDBKeyRange, collection?: string)  | Observable\<T \| T[] \| null\>|
|.update\<T\>      | (key?: string \| number, data?: {}, collection?: string) | Observable\<IDBValidKey \| null\>|
|.remove      | (key: string \| number, collection?: string)  | Observable\<void\>|
|.safe\<T\>   | (method: () => Observable<T>)  | Observable\<T\>|
|.safeList\<T\>   | (query?: IDBKeyRange, collection?: string)  | Observable\<T[]\>|

