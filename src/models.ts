export interface IdbRequestEvent extends Event {
  target: IDBRequest;
}

export interface IdbTransactionEvent extends Event {
  target: IDBTransaction;
}

export interface IdbResponseEvent<T> extends Event {
  target: IdbResponse<T>;
}

export interface IdbResponse<T> extends EventTarget {
  result: T;
}

export interface IdbOpenRequestEvent extends Event {
  target: IdbOpenDBRequest;
}

export interface IdbVersionChangeEvent extends IDBVersionChangeEvent {
  target: IdbOpenDBRequest;
}

export interface IdbOpenDBRequest extends IDBOpenDBRequest {
  errorCode: number;
}
