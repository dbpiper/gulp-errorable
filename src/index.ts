import { parallel, series } from 'gulp';
import _ from 'lodash';
import { Task, TaskFunction } from 'undertaker';
import DefaultRegistry from 'undertaker-registry';

// This simply matches the type used in undertaker
// tslint:disable-next-line: no-any
type PromiseTaskFunction<T> = (done: (error?: any) => void) => Promise<T>;
type PromiseComposeTaskFunction<T> = (...tasks: Task[]) => Promise<T>;
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

const isString = (stringObject: string | undefined): stringObject is string =>
  typeof stringObject === 'string';

const _promisifyComposeTaskFunction = (
  composeTaskFunction: (...tasks: Task[]) => TaskFunction,
) => (options: {
  name?: string;
  tasks: Task[];
  // tslint:disable-next-line: no-any
}) => {
  const composablePromiseFunction = () =>
    new Promise((resolve, reject) => {
      composeTaskFunction(...options.tasks)(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

  if (isString(options.name)) {
    // console.log(options);
    Object.defineProperty(composablePromiseFunction, 'name', {
      value: options.name,
    });
  }
  return composablePromiseFunction;
};

const seriesPromise = (options: {
  name?: string;
  tasks: Task[];
  // tslint:disable-next-line: no-any
}): PromiseComposeTaskFunction<any> =>
  _promisifyComposeTaskFunction(series)(options);

const parallelPromise = (options: {
  name?: string;
  tasks: Task[];
  // tslint:disable-next-line: no-any
}): PromiseComposeTaskFunction<any> =>
  _promisifyComposeTaskFunction(parallel)(options);

export { ErrorableRegistry, seriesPromise, parallelPromise };
