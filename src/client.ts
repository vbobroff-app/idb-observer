import { catchError, fromEvent, map, merge, Observable, of, tap } from 'rxjs';
import { IdbOpenRequestEvent } from './models';

export class IdbService {
  private readonly request: IDBOpenDBRequest;

  constructor(name: string, version?: number) {
    this.request = indexedDB.open(name, version);
  }

  /**
   * Attempts to open a connection to the named database with the new version, longer than current, or 1 if it does not already exist.
   * If the request is successful request's result will be the connection.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBFactory/open)
   */
  upgrade(): Observable<IDBDatabase | null> {
    return this.common('upgradeneeded');
  }

  /**
   * Attempts to open a connection to the named database with the current version.
   * If the request is successful request's result will be the connection.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBFactory/open)
   */
  init(): Observable<IDBDatabase | null> {
    return this.common('success');
  }

  private common(successEvent: string) {
    const success = fromEvent(this.request, successEvent).pipe(
      map((e) => (e as IdbOpenRequestEvent).target.result),
    );

    const error = fromEvent(this.request, 'error').pipe(
      tap((e) => {
        throw new Error(
          `Ошибка при открытии БД. Код ошибки:, ${(e as IdbOpenRequestEvent).target.errorCode}`,
        );
      }),
      map(() => null),
    );

    return merge(error, success).pipe(
      catchError((e: Error) =>
        of(e).pipe(
          tap((e) => console.error(e)),
          map(() => null),
        ),
      ),
    );
  }
}
