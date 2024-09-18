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
  idbApi.init(db, collection);
});
client.init().subscribe((db)=> { idbApi.init(db, collection); });
```

## api methods

* .create
* .list
* .get
* .update
* .remove

## sample
Create and manipulate the Post object:
```sh
interface Post {
 id?: string;
 text: string;
 title: string;
 description: string;
 author: string;
 created?: Date;
 changed?: Date;
 watched?: Date;
 icon?: string;   
}
const id = '#111';
const post: Post = {
  id,
  text: 'Test of post',
  title: 'This is Post #111',
  description: 'description',
  author: 'Viktor Bobrofff'
}

idbApi.create<Post>(post).subscribe((id)=>console.log('created', id));
idbApi.update<Post>(id, {author: 'Ivan Ivanov'}).subscribe((id)=>console.log('updated', id));
idbApi.list<Post>().subscribe((posts) => console.log('list', posts));
idbApi.get<Post>(id).subscribe((post)=>console.log('get', post));
idbApi.remove(id).subscribe();
```
Don't forget to unsubsribe!

|API method|Parameters|result|
|---       |---       |---   |
|.create\<T\>| (doc: T, key?: IDBValidKey, collection?: string) | Observable\<string \| undefined\> |
|.list\<T\>       | (query?: IDBKeyRange, collection?: string)  | Observable<T[]>|
|.get\<T\>       | (query: IDBValidKey \| IDBKeyRange, collection?: string)  | Observable\<T \| T[] \| null\>|
|.update\<T\>      | (key?: string \| number, data?: {}, collection?: string) | Observable\<IDBValidKey \| null\>|
|.remove      | (key: string \| number, collection?: string)  | Observable\<void\>|


