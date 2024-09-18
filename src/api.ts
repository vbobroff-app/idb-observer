import { catchError, from, fromEvent, map, merge, mergeMap, Observable, of, switchMap, take, tap, toArray } from 'rxjs';

import { IdbRequestEvent, IdbResponseEvent, IdbTransactionEvent } from './models';

import { isRu, isValid } from './utils';
import { accessErrorMessage, collectionErrorMessage, dbErrorMessage, notFoundError, transactionCancelMessage, transactionErrorMessage } from './defaults';

export class IdbApi {
  private db: IDBDatabase | undefined;
  private collection: string | undefined;

  constructor(db?: IDBDatabase, collection?: string) {
    this.db = db;
    this.collection = collection;
  }

  public init(db: IDBDatabase, collection?: string, keyPath?: string, autoIncrement?: boolean) {
    this.setDb(db);
    if (collection) {
      this.setCollection(collection, keyPath, autoIncrement);
    }
  }

  public setDb(db: IDBDatabase) {
    try {
      if (!db) {
        throw new Error(`${dbErrorMessage} ${db}`);
      }
      this.db = db;
    } catch {
      console.error(`ERROR: DB don't set in API.`);
    }
  }

  public get Db() {
    return this.db;
  }

  public setCollection(name: string, keyPath?: string, autoIncrement?: boolean) {
    try {
      if (!this.db) {
        throw new Error(`${dbErrorMessage}`);
      }
      if (!name || !isValid(name)) {
        throw new Error(`Incorrect name"${name}"`);
      }
      if (!this.db.objectStoreNames.contains(name)) {
        if (!keyPath) keyPath = 'id';
        if (!autoIncrement) autoIncrement = false;
        this.db.createObjectStore(name, { keyPath, autoIncrement });
      }
      this.collection = name;
    } catch {
      console.error(`ERROR: Collection don't set in API`);
    }
  }

  public get Collection() {
    return this.collection;
  }

  /**
   * Adds or updates a record in store with the given value and key.
   *
   * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
   *
   * If successful, request's result will be the record's key.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/add)
   */
  create<T>(doc: T, key?: IDBValidKey, collection?: string): Observable<string | undefined> {
    if (!doc) {
      const errorMessage = isRu() ? 'Невалидный объект создания.' : 'Creating object is no valid.';
      console.error(`ERROR: ${errorMessage} ${doc}`);
      return of(undefined);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of(undefined);
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of(undefined);
    }

    const request = this.db.transaction(collection, 'readwrite').objectStore(collection).add(doc, key);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`ERROR: ${transactionErrorMessage} "${collection}"`);
      return of(undefined);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(`${transactionCancelMessage} ${(e as IdbTransactionEvent)?.target?.error}`);
      }),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        const errorMessage = isRu() ? 'Ошибка создания записи,' : 'Record created error, ';
        throw new Error(`${errorMessage} ${(e as IdbRequestEvent)?.target?.error}`);
      }),
    );

    const successEvent = fromEvent(request, 'success').pipe(
      tap((e) => {
        if (!(e as IdbRequestEvent)?.target?.result) {
          const errorMessage = isRu() ? 'Ошибка создания записи,' : 'Record created error, ';
          throw new Error(`${errorMessage}`);
        }
      }),
      map((e) => (e as IdbRequestEvent).target.result),
    );

    return merge(abortEvent, errorEvent, successEvent).pipe(
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => undefined),
        ),
      ),
    );
  }

  /**
   * Retrieves all values of the records matching the given key or key range in query (up to count if given).
   * @param query - Is IDBKeyRange object, it has static fields
   * @returns values array [value1, ...value2]
   *
   * @Sample query: IDBKeyRange.lowerBound('keyFrom'),  IDBKeyRange.bound('keyFrom','keyTo')
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/getAll)
   */
  list<T>(query?: IDBKeyRange, collection?: string): Observable<T[]> {
    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of([]);
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of([]);
    }

    const request = this.db.transaction(collection).objectStore(collection).getAll(query);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`ERROR: ${transactionErrorMessage} "${collection}"`);
      return of([]);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(`${transactionCancelMessage}, ${(e as IdbTransactionEvent)?.target?.error}`);
      }),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        throw new Error(`${accessErrorMessage}  ${(e as IdbRequestEvent).target.error}`);
      }),
    );

    const successEvent = fromEvent(request, 'success').pipe(map((e: Event) => (e as IdbRequestEvent).target.result));

    return merge(abortEvent, errorEvent, successEvent).pipe(
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => []),
        ),
      ),
    );
  }

  /**
   * Retrieves values by range in ids array.
   * @param ids - ids array [id1, id2,..., id]
   * @returns values array [value1, ...value2]
   *
   */
  getBy<T>(ids: string | number[], collection?: string): Observable<T[]> {
    if (!ids?.length) {
      return of([]);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of([]);
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of([]);
    }

    const objectStore = this.db.transaction(collection).objectStore(collection);

    const transaction = objectStore.transaction;
    if (!transaction) {
      console.error(`ERROR: ${transactionErrorMessage} "${collection}"`);
      return of([]);
    }

    const get = (id: string | number) => objectStore.get(id);

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(`${transactionCancelMessage}, ${(e as IdbTransactionEvent).target.error}`);
      }),
    );

    const getErrorEvent = (id: string | number, request: IDBRequest<T>) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(`${accessErrorMessage} ${id}  ${(e as IdbRequestEvent)?.target?.error}`);
        }),
      );

    const getSuccessEvent = (id: string | number, request: IDBRequest<T>) =>
      fromEvent(request, 'success').pipe(
        tap((e: Event) => {
          const post = (e as IdbResponseEvent<T>)?.target?.result;
          if (!post) {
            console.error(`${accessErrorMessage} ${id}, ${notFoundError}`);
          }
        }),
      );

    const count = ids.length;

    return from(ids).pipe(
      map((id) => ({ id, request: get(id) })),
      mergeMap(({ id, request }) => merge(getSuccessEvent(id, request), getErrorEvent(id, request), abortEvent)),
      map((e: Event) => ((e as IdbRequestEvent).target.error != null ? undefined : (e as IdbRequestEvent).target.result)),
      take(count),
      toArray(),
      map((doc) => doc.filter((d) => !!d)),
    );
  }

  get<T>(query: IDBValidKey | IDBKeyRange, collection?: string): Observable<T | T[] | null | undefined> {
    if (!query) {
      return of(null);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of(undefined);
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of(undefined);
    }

    const request = this.db.transaction(collection).objectStore(collection).get(query);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`ERROR: ${transactionErrorMessage} "${collection}"`);
      return of(null);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(`${transactionCancelMessage} ${(e as IdbTransactionEvent).target.error}`);
      }),
      map(() => null),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        throw new Error(`${accessErrorMessage}  ${(e as IdbRequestEvent).target.error}`);
      }),
      map(() => null),
    );

    const successEvent = fromEvent(request, 'success').pipe(
      tap((e: Event) => {
        const value = (e as IdbResponseEvent<T>)?.target?.result as T;
        if (!value) {
          throw new Error(`${accessErrorMessage} ${query}, ${notFoundError}`);
        }
      }),
      map((e: Event) => (e as IdbResponseEvent<T>).target.result),
    );

    return merge(abortEvent, errorEvent, successEvent).pipe(
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => null),
        ),
      ),
    );
  }

  /**
   *Updates a record in store with the given value and Id (key).
   *
   * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
   *
   * Any existing record with the key will be replaced. with request's error set to a "ConstraintError" DOMException.
   *
   * If successful, request's result will be the record's key.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/put)
   */
  update<T>(key?: string | number, data?: {}, collection?: string): Observable<IDBValidKey | null | undefined> {
    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of(undefined);
    }

    if (!key) {
      key = (data as { id?: string | number })?.id;
    }
    if (!key) {
      console.error(`ERROR: Key no found, id= "${key}"`);
      return of(null);
    }

    if (!data) {
      data = {};
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of(undefined);
    }

    const objectStore = this.db.transaction(collection, 'readwrite').objectStore(collection);

    const check = objectStore.openCursor(key);

    const successCheck = fromEvent(check as IDBRequest<IDBCursorWithValue | null>, 'success').pipe(
      map((e: Event | null) => {
        const value = (e as IdbResponseEvent<IDBCursorWithValue>)?.target?.result?.value as T;
        if (!value) {
          throw new Error(`${accessErrorMessage} ${key}, ${notFoundError}`);
        }
        return value as T;
      }),
    );

    const updated = (doc: T, data: {}) => ({ ...doc, ...data });

    const ofPutRequest = (doc: T) => of(objectStore.put(updated(doc, data)));

    const abortEvent = (request: IDBRequest) =>
      fromEvent(request.transaction as IDBTransaction, 'abort').pipe(
        tap((e: Event) => {
          throw new Error(`${transactionCancelMessage}, ${(e as IdbTransactionEvent).target.error}`);
        }),
        map(() => null),
      );

    const errorEvent = (request: IDBRequest) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(`Mutation error,  ${(e as IdbRequestEvent).target.error}`);
        }),
        map(() => null),
      );

    const successEvent = (request: IDBRequest<IDBValidKey>) =>
      fromEvent(request, 'success').pipe(map((e: Event) => (e as IdbResponseEvent<IDBValidKey>).target.result as IDBValidKey));

    return successCheck.pipe(
      switchMap((doc: T) => ofPutRequest(doc)),
      switchMap((request: IDBRequest<IDBValidKey>) => merge(abortEvent(request), errorEvent(request), successEvent(request))),
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => null),
        ),
      ),
    );
  }

  /**
   * Deletes records in store by id (key).
   *
   * If successful, request's result may be undefined.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/delete)
   */
  remove(key: string | number, collection?: string): Observable<void> {
    if (!key) {
      return of(void 0);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection || !isValid(collection)) {
      console.error(`ERROR: ${collectionErrorMessage} "${collection}"`);
      return of(void 0);
    }

    if (!this.db) {
      console.error(`ERROR: ${dbErrorMessage}`);
      return of(undefined);
    }

    const objectStore = this.db.transaction(collection, 'readwrite').objectStore('posts');

    const check = objectStore.openCursor(key);

    const successCheck = fromEvent(check as IDBRequest<IDBCursorWithValue | null>, 'success').pipe(
      tap((e: Event | null) => {
        const value = (e as IdbResponseEvent<IDBCursorWithValue>)?.target?.result?.value;
        if (!value) {
          throw new Error(`${accessErrorMessage} ${key}, ${notFoundError}`);
        }
      }),
    );

    const abortEvent = (request: IDBRequest) =>
      fromEvent(request.transaction as IDBTransaction, 'abort').pipe(
        tap((e: Event) => {
          throw new Error(`${transactionCancelMessage}, ${(e as IdbTransactionEvent).target.error}`);
        }),
      );

    const errorEvent = (request: IDBRequest) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(`Delete error,  ${(e as IdbRequestEvent).target.error}`);
        }),
      );

    const successEvent = (request: IDBRequest) => fromEvent(request, 'success').pipe(map((e: Event) => (e as IdbRequestEvent).target.result));

    const ofDeleteRequest = of(objectStore.delete(key));

    return successCheck.pipe(
      switchMap(() => ofDeleteRequest),
      switchMap((request) => merge(abortEvent(request), errorEvent(request), successEvent(request))),
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => undefined),
        ),
      ),
    );
  }
}
