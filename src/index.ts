import { series, task } from 'gulp';
import _ from 'lodash';
import { Task, TaskFunction } from 'undertaker';
import { slackSendMessage } from '../config/gulp/helpers/slack';

// This simply matches the type used in undertaker
// tslint:disable-next-line: no-any
type PromiseTaskFunction<T> = (done: (error?: any) => void) => Promise<T>;

const taskErrorable = <T>(
  taskFunction: PromiseTaskFunction<T>,
): PromiseTaskFunction<T> => () =>
  new Promise<T>(async (resolve, reject) => {
    try {
      const result = await taskFunction(() => undefined);
      resolve(result);
    } catch (error) {
      await slackSendMessage(false);
      reject(error);
    }
  });

const _createTaskFunctions = <T>(
  // tslint:disable-next-line: prefer-array-literal
  ...taskFunctionCandidates: Array<PromiseTaskFunction<T>>
) => {
  const arrayCandidates = [...taskFunctionCandidates];
  return _.map(arrayCandidates, taskFunctionCandidate => {
    const taskFunction = taskErrorable(taskFunctionCandidate);
    return {
      taskFunction,
      name: taskFunctionCandidate.name,
    };
  });
};

const seriesErrorable = <T>(
  // tslint:disable-next-line: prefer-array-literal
  ...taskFunctionCandidates: Array<PromiseTaskFunction<T>>
): TaskFunction => {
  const taskFunctions = _createTaskFunctions(...taskFunctionCandidates);
  const registerTasks: Task[] = _.map(taskFunctions, wrappedTaskFunction => {
    task(wrappedTaskFunction.name, wrappedTaskFunction.taskFunction);
    console.log(wrappedTaskFunction.name);
    return task(wrappedTaskFunction.name);
  });
  return series(registerTasks);
};

export { taskErrorable, seriesErrorable };
