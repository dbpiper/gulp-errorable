import terminalSpawn from 'terminal-spawn';

import { slackSendMessage, startTimer } from './config/gulp/helpers/slack';
import { seriesErrorable } from './src/index';

/* *****************************************************************************
 * Private
 **************************************************************************** */

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

const _sleepPreviewSeconds = 8;

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

const _runTest = () => terminalSpawn('npx jest').promise;

const _buildJs = () =>
  terminalSpawn(`npx babel src --out-dir lib --extensions ".ts"`).promise;

const _buildTypes = () => terminalSpawn('npx tsc').promise;

const _checkTypes = () => terminalSpawn('npx tsc -p "./tsconfig.json"').promise;

const _lintTS = () => {
  const rootFiles = '"./*.ts?(x)"';
  const srcFiles = '"./src/**/*.ts?(x)"';
  const configFiles = '"./config/**/*.ts?(x)"';
  const tsconfig = '--project tsconfig.json';
  return terminalSpawn(
    `npx tslint ${rootFiles} ${srcFiles} ${configFiles} ${tsconfig}`,
  ).promise;
};

const _gitStatus = () => terminalSpawn('npx git status').promise;

const _sleep = (seconds: number = 0) =>
  terminalSpawn(`sleep ${seconds}`).promise;

const _sleepForReview = () => {
  // giving 4 seconds to review the git commit status
  const reviewTime = 4;
  return _sleep(reviewTime);
};

const _gitStatusHumanReview = seriesErrorable(_gitStatus, _sleepForReview);

const _failMe = () => Promise.reject('failed!!');

/* *****************************************************************************
 * Public
 **************************************************************************** */

const lint = seriesErrorable(_lintTS, _checkTypes);

const build = seriesErrorable(_buildJs, _buildTypes);

const test = seriesErrorable(build, _runTest);

const verify = seriesErrorable(
  _registerSlackNotify,
  _gitStatusHumanReview,
  _slackNotify,
);

export { lint, build, test, verify };
