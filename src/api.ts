import {
  catchError,
  from,
  fromEvent,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
  toArray,
} from 'rxjs';

import {
  IdbRequestEvent,
  IdbResponseEvent,
  IdbTransactionEvent,
} from './models';

export class IdbRxJsApi {
  public db: IDBDatabase;

  private readonly destroy$ = new Subject();

  private readonly collection: string | undefined;
  constructor(db: IDBDatabase, collection?: string) {
    this.db = db;
    this.collection = collection;
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
  create<T>(
    doc: T,
    key?: IDBValidKey,
    collection?: string,
  ): Observable<string | undefined> {
    if (!doc) {
      console.error(`Невалидный объект создания ${doc}`);
      return of(undefined);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of(undefined);
    }

    const request = this.db
      .transaction(collection, 'readwrite')
      .objectStore(collection)
      .add(doc, key);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`Невалидная транзакция в 
                "${collection}"`);
      return of(undefined);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(
          `Транзакция была отменена, ${(e as IdbTransactionEvent)?.target?.error}`,
        );
      }),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        throw new Error(
          `Ошибка создания записи,  ${(e as IdbRequestEvent)?.target?.error}`,
        );
      }),
    );

    const successEvent = fromEvent(request, 'success').pipe(
      tap((e) => {
        if (!(e as IdbRequestEvent)?.target?.result) {
          throw new Error(`Ошибка создания записи`);
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

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of([]);
    }

    const request = this.db
      .transaction(collection)
      .objectStore(collection)
      .getAll(query);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`Невалидная транзакция в 
                    "${collection}"`);
      return of([]);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(
          `Транзакция была отменена, ${(e as IdbTransactionEvent)?.target?.error}`,
        );
      }),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        throw new Error(
          `Ошибка доступа,  ${(e as IdbRequestEvent).target.error}`,
        );
      }),
    );

    const successEvent = fromEvent(request, 'success').pipe(
      map((e: Event) => (e as IdbRequestEvent).target.result),
    );

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

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of([]);
    }

    const objectStore = this.db.transaction(collection).objectStore(collection);

    const transaction = objectStore.transaction;
    if (!transaction) {
      console.error(`Невалидная транзакция в 
                    "${collection}"`);
      return of([]);
    }

    const get = (id: string | number) => objectStore.get(id);

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(
          `Транзакция была отменена, ${(e as IdbTransactionEvent).target.error}`,
        );
      }),
    );

    const getErrorEvent = (id: string | number, request: IDBRequest<T>) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(
            `Ошибка доступа к ${id}  ${(e as IdbRequestEvent)?.target?.error}`,
          );
        }),
      );

    const getSuccessEvent = (id: string | number, request: IDBRequest<T>) =>
      fromEvent(request, 'success').pipe(
        tap((e: Event) => {
          const post = (e as IdbResponseEvent<T>)?.target?.result;
          if (!post) {
            console.error(`ERROR: Ошибка доступа к ${id}, объект не найден`);
          }
        }),
      );

    const count = ids.length;

    return from(ids).pipe(
      map((id) => ({ id, request: get(id) })),
      mergeMap(({ id, request }) =>
        merge(
          getSuccessEvent(id, request),
          getErrorEvent(id, request),
          abortEvent,
        ),
      ),
      map((e: Event) =>
        (e as IdbRequestEvent).target.error != null
          ? undefined
          : (e as IdbRequestEvent).target.result,
      ),
      take(count),
      toArray(),
      map((doc) => doc.filter((d) => !!d)),
    );
  }

  get<T>(
    query: IDBValidKey | IDBKeyRange,
    collection?: string,
  ): Observable<T | T[] | null> {
    if (!query) {
      return of(null);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of(null);
    }

    const request = this.db
      .transaction(collection)
      .objectStore(collection)
      .get(query);

    const transaction = request.transaction;
    if (!transaction) {
      console.error(`Невалидная транзакция в 
                    "${collection}"`);
      return of(null);
    }

    const abortEvent = fromEvent(transaction, 'abort').pipe(
      tap((e: Event) => {
        throw new Error(
          `Транзакция была отменена, ${(e as IdbTransactionEvent).target.error}`,
        );
      }),
      map(() => null),
    );

    const errorEvent = fromEvent(request, 'error').pipe(
      tap((e: Event) => {
        throw new Error(
          `Ошибка доступа,  ${(e as IdbRequestEvent).target.error}`,
        );
      }),
      map(() => null),
    );

    const successEvent = fromEvent(request, 'success').pipe(
      tap((e: Event) => {
        const value = (e as IdbResponseEvent<T>)?.target?.result as T;
        if (!value) {
          throw new Error(`Ошибка доступа к ${query}, объект не найден`);
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
  update<T>(
    id?: string | number,
    data?: {},
    collection?: string,
  ): Observable<T | null> {
    if (!id) {
      id = (data as { id?: string | number })?.id;
    }
    if (!id) {
      console.error(`Невалидное значение id= "${id}"`);
      return of(null);
    }

    if (!data) {
      data = {};
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of(null);
    }

    const objectStore = this.db
      .transaction(collection, 'readwrite')
      .objectStore(collection);

    const check = objectStore.openCursor(id);

    const successCheck = fromEvent(
      check as IDBRequest<IDBCursorWithValue | null>,
      'success',
    ).pipe(
      map((e: Event | null) => {
        const value = (e as IdbResponseEvent<IDBCursorWithValue>)?.target
          ?.result?.value as T;
        if (!value) {
          throw new Error(`Ошибка доступа к ${id}, объект не найден`);
        }
        return value as T;
      }),
    );

    const updated = (doc: T, data: {}) => ({ ...doc, ...data });

    const ofPutRequest = (doc: T) => of(objectStore.put(updated(doc, data)));

    const abortEvent = (request: IDBRequest) =>
      fromEvent(request.transaction as IDBTransaction, 'abort').pipe(
        tap((e: Event) => {
          throw new Error(
            `Транзакция была отменена, ${(e as IdbTransactionEvent).target.error}`,
          );
        }),
        map(() => null),
      );

    const errorEvent = (request: IDBRequest) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(
            `Ошибка при мутации,  ${(e as IdbRequestEvent).target.error}`,
          );
        }),
        map(() => null),
      );

    const successEvent = (request: IDBRequest<IDBValidKey>) =>
      fromEvent(request, 'success').pipe(
        map((e: Event) => (e as IdbResponseEvent<T>).target.result as T),
      );

    return successCheck.pipe(
      switchMap((doc: T) => ofPutRequest(doc)),
      switchMap((request: IDBRequest<IDBValidKey>) =>
        merge(abortEvent(request), errorEvent(request), successEvent(request)),
      ),
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
  remove(id: string | number, collection?: string): Observable<void> {
    if (!id) {
      return of(void 0);
    }

    if (!collection) {
      collection = this.collection;
    }

    if (!collection) {
      console.error(`Невалидная коллекция "${collection}"`);
      return of(void 0);
    }

    const objectStore = this.db
      .transaction(collection, 'readwrite')
      .objectStore('posts');

    const check = objectStore.openCursor(id);

    const successCheck = fromEvent(
      check as IDBRequest<IDBCursorWithValue | null>,
      'success',
    ).pipe(
      tap((e: Event | null) => {
        const value = (e as IdbResponseEvent<IDBCursorWithValue>)?.target
          ?.result?.value;
        if (!value) {
          throw new Error(`Ошибка доступа к ${id}, объект не найден`);
        }
      }),
    );

    const abortEvent = (request: IDBRequest) =>
      fromEvent(request.transaction as IDBTransaction, 'abort').pipe(
        tap((e: Event) => {
          throw new Error(
            `Транзакция была отменена, ${(e as IdbTransactionEvent).target.error}`,
          );
        }),
      );

    const errorEvent = (request: IDBRequest) =>
      fromEvent(request, 'error').pipe(
        tap((e: Event) => {
          throw new Error(
            `Ошибка при удалении,  ${(e as IdbRequestEvent).target.error}`,
          );
        }),
      );

    const successEvent = (request: IDBRequest) =>
      fromEvent(request, 'success').pipe(
        map((e: Event) => (e as IdbRequestEvent).target.result),
      );

    const ofDeleteRequest = of(objectStore.delete(id));

    return successCheck.pipe(
      switchMap(() => ofDeleteRequest),
      switchMap((request) =>
        merge(abortEvent(request), errorEvent(request), successEvent(request)),
      ),
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => undefined),
        ),
      ),
    );
  }
}
