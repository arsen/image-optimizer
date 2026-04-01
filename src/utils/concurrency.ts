type LimitFn = <T>(fn: () => Promise<T>) => Promise<T>;

export function pLimit(concurrency: number): LimitFn {
  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length > 0 && active < concurrency) {
      queue.shift()!();
    }
  }

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(
          (val) => {
            active--;
            resolve(val);
            next();
          },
          (err) => {
            active--;
            reject(err);
            next();
          },
        );
      };

      if (active < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
}
