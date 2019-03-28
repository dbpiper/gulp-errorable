# gulp-errorable

A module providing a custom registry which decorates gulp tasks, to provide
the ability to execute error logging functionality in the event that an error
occurs. I made this because I wanted to have my verification script, which
is basically a local version of my CI script, send me slack messages. However,
the time involved in sending the slack message, over the network, meant that
gulp terminated the slack messaging function before it could send.

This decorator-based approach allows gulp to wait until a long-running function
is finished executing before it terminates. In essence, it allows me to send
my slack messages. However, it can really do anything that is needed if an error
is found.

## Usage Instructions

Import the library and tell gulp to use its registry.

The function to be executed if an error is found, will be awaited, thus it
should return a `Promise`.

```ts
import { ErrorableRegistry } from 'gulp-errorable';

const myErrorLoggingFunction = () =>
  new Promise((resolve, _reject) => {
    console.warn('we found an error!');
    resolve();
  });

gulp.registry(new ErrorableRegistry(myErrorLoggingFunction));
```

Task example:

```ts
// assumes that these are all valid tasks
// for example:
const lint = seriesPromise(_lintTs, _checkTypes);

const verify = series(
  _registerSlackNotify,
  _gitStatusHumanReview,
  lint,
  test,
  _slackNotify,
);

export { lint, test };
```

This is essentially the same way that gulp is normally used.

## Caveats

All tasks must use the gulp Promise-based completion method. This is just a
simplifying assumption made, due to the limited amount of safe information
given to module by gulp. To help facilitate this the `gulp-errorable` provides
several wrappers around `series` and `parallel`. These essentially "promisify"
each of these functions respectively.

Due to this, the names of the tasks using these will not be very friendly,
specifically: they will be `<anonymous>`. I am planning to allow users to provide
their own names in the future to help make this less of a problem.l

[gulp-promise]: https://gulpjs.com/docs/en/getting-started/async-completion#returning-a-promise
