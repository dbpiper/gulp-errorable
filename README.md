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
const lint = seriesPromise({
  name: 'lint',
  tasks: [_lintTs, _checkTypes],
});

const verify = seriesPromise({
  name: 'verify',
  tasks: [
    _registerSlackNotify,
    _gitStatusHumanReview,
    lint,
    test,
    _slackNotify,
  ],
});

export { lint, test };
```

This is essentially the same way that gulp is normally used.

## API

### ErrorableRegistry(errorHandlingFunction)

- ```ts
  ErrorableRegistry(errorHandlingFunction: ErrorHandlingFunction)

  // where the type of ErrorHandlingFunction is:
  type ErrorHandlingFunction = () => Promise<any>;
  ```

  This is the main custom gulp registry which allows you to provide a function
  to decorate your tasks, in other words it allows you to do something specific
  if an error is found in a task. Essentially, you can use this function to
  do something like make a network request or write to a log file or whatever.

---

### seriesPromise(options)

- ```ts
  seriesPromise(options:{
    name?: string;
    tasks: Task[];
  })
  ```

  Will create a task that wraps series it is essentially equivalent to something
  like:

  ```ts
  const exampleTask = series(task1, task1);
  ```

  The name is optional, but if it is not provided it will be `<anonymous>`, see
  [Caveats](#caveats).

---

### seriesPromise(options)

- ```ts
  parallelPromise(options:{
    name?: string;
    tasks: Task[];
  })
  ```

  Will create a task that wraps parallel it is essentially equivalent to something
  like:

  ```ts
  const exampleTask = parallel(task1, task1);
  ```

  The name is optional, but if it is not provided it will be `<anonymous>`, see
  [Caveats](#caveats).

## Caveats

All tasks must use the [gulp Promise-based completion method][gulp-promise].
This is just a simplifying assumption made, due to the limited amount of safe information
given to the module by gulp. To help facilitate this the `gulp-errorable` provides
several wrappers around `series` and `parallel`. These essentially "promisify"
each of these functions respectively.

Due to this, the names of the tasks using these will not be very friendly,
specifically: they will be `<anonymous>`. However, a name can be provided
which fixes this problem, this is optional, and the `<anonymous>` name can
be used if desired, for some reason.

## License

[MIT](https://github.com/dbpiper/gulp-errorable/blob/master/LICENSE) Copyright (c) [David Piper](https://github.com/dbpiper)

[gulp-promise]: https://gulpjs.com/docs/en/getting-started/async-completion#returning-a-promise
