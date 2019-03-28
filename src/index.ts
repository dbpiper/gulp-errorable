import { parallel, series } from 'gulp';
import _ from 'lodash';
import { Task } from 'undertaker';
import DefaultRegistry from 'undertaker-registry';

// This simply matches the type used in undertaker
// tslint:disable-next-line: no-any
type PromiseTaskFunction<T> = (done: (error?: any) => void) => Promise<T>;
// tslint:disable-next-line: no-any
export type ErrorHandlingFunction = () => Promise<any>;

const _taskErrorable = <T>(
  errorHandlingFunction: ErrorHandlingFunction,
  taskFunction: PromiseTaskFunction<T>,
): PromiseTaskFunction<T> => () =>
  new Promise<T>(async (resolve, reject) => {
    try {
      const result = await taskFunction(() => undefined);
      resolve(result);
    } catch (error) {
      await errorHandlingFunction();
      reject(error);
    }
  });

class ErrorableRegistry extends DefaultRegistry {
  // tslint:disable-next-line: no-any
  [task: string]: any;
  public errorHandlingFunction: ErrorHandlingFunction;

  // tslint:disable-next-line: no-any
  constructor(errorHandlingFunction: ErrorHandlingFunction) {
    super();
    this.errorHandlingFunction = errorHandlingFunction;
  }

  // tslint:disable-next-line: no-any
  public set(name: string, fn: any): any {
    // this is a private variable and thus has no
    // type definitions, it makes no sense to do so as no one should
    // be using them, aside from people implementing custom registries
    // tslint:disable-next-line: no-unsafe-any
    return (this._tasks[name] = _taskErrorable(this.errorHandlingFunction, fn));
  }
}

const seriesPromise = (...tasks: Task[]): PromiseTaskFunction<any> => () =>
  new Promise((resolve, reject) => {
    series(...tasks)(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const parallelPromise = (...tasks: Task[]): PromiseTaskFunction<any> => () =>
  new Promise((resolve, reject) => {
    parallel(...tasks)(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export { ErrorableRegistry, seriesPromise, parallelPromise };
