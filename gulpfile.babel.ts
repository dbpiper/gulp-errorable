import gulp from 'gulp';
import terminalSpawn from 'terminal-spawn';

import { slackSendMessage, startTimer } from './config/gulp/helpers/slack';
import {
  ErrorableRegistry,
  ErrorHandlingFunction,
  seriesPromise,
} from './src/index';

/* *****************************************************************************
 * Private
 **************************************************************************** */

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

const _slackErrorHandler: ErrorHandlingFunction = () => slackSendMessage(false);

const _sleep = (seconds: number = 0) =>
  terminalSpawn(`sleep ${seconds}`).promise;

// -----------------------------------------------------------------------------
// Gulp Registry
// -----------------------------------------------------------------------------

gulp.registry(new ErrorableRegistry(_slackErrorHandler));

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

// Slack

const _registerSlackNotify = () => {
  startTimer();
  return Promise.resolve();
};

const _slackNotify = async () => {
  const slackPromise = slackSendMessage();
  await slackPromise;
  return Promise.resolve();
};

const _runTest = () => terminalSpawn('npx jest --passWithNoTests').promise;

const _buildJs = () =>
  terminalSpawn(`npx babel src --out-dir lib --extensions ".ts"`).promise;

const _buildTypes = () => terminalSpawn('npx tsc').promise;

const _checkTypes = () => terminalSpawn('npx tsc -p "./tsconfig.json"').promise;

const _lintTs = () => {
  const rootFiles = '"./*.ts?(x)"';
  const srcFiles = '"./src/**/*.ts?(x)"';
  const configFiles = '"./config/**/*.ts?(x)"';
  const tsconfig = '--project tsconfig.json';
  return terminalSpawn(
    `npx tslint ${rootFiles} ${srcFiles} ${configFiles} ${tsconfig}`,
  ).promise;
};

const _gitStatus = () => terminalSpawn('npx git status').promise;

const _sleepForReview = () => {
  // giving 4 seconds to review the git commit status
  const reviewTime = 4;
  return _sleep(reviewTime);
};

const _gitStatusHumanReview = seriesPromise({
  name: '_gitStatusHumanReview',
  tasks: [_gitStatus, _sleepForReview],
});

/* *****************************************************************************
 * Public
 **************************************************************************** */

const lint = seriesPromise({
  name: 'lint',
  tasks: [_lintTs, _checkTypes],
});

const build = seriesPromise({
  name: 'build',
  tasks: [_buildJs, _buildTypes],
});

const test = seriesPromise({
  name: 'test',
  tasks: [build, _runTest],
});

const lintTest = seriesPromise({
  name: 'lintTest',
  tasks: [lint, test],
});

const verifyCi = seriesPromise({
  name: 'verifyCi',
  tasks: [_registerSlackNotify, lintTest],
});

const verify = seriesPromise({
  name: 'verify',
  tasks: [_registerSlackNotify, _gitStatusHumanReview, lintTest, _slackNotify],
});

export { lint, build, test, verify, verifyCi, lintTest };
