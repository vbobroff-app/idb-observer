import { isRu } from './utils';

export const notInitiatedMessage = isRu() ? 'API не инициализировано' : 'API not initiated';

export const dbErrorMessage = isRu() ? 'Невалидная БД' : 'DB is no valid';

export const clearErrorMessage = isRu() ? 'Ошибка при очистке коллекции,' : 'Collection clear() error, ';

export const openErrorMessage = isRu() ? 'Ошибка при открытии БД. Код ошибки:' : 'Opens DB error. Error code:';

export const transactionErrorMessage = isRu() ? 'Невалидная транзакция в' : 'Transaction is no valid, ';

export const collectionErrorMessage = isRu() ? 'Невалидная коллекция' : 'Collection is no valid';

export const transactionCancelMessage = isRu() ? 'Транзакция была отменена,' : 'Transaction was canceled, ';

export const accessErrorMessage = isRu() ? 'Ошибка доступа,' : 'Access error, ';
export const notFoundError = isRu() ? 'объект не найден' : 'object not found';
