import delay from 'delay';
import { promiseFilter } from './promise-filter';
import { describe, expect, it } from 'vitest';

describe('promise filter', () => {

  it('it works', async () => {

    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    const order = [] as typeof arr;

    const result = await promiseFilter(arr, async (el, index) => {
      try {
        // for the test, dont make element 5 wait and add it to the true result (while 5 % 2 !== 0)
        if (el === 5) return true;
        await delay(1000 - (100 * index));
        return el % 2 === 0;
      } finally {
        order.push(el);
      }
    });

    expect(result.length).toBe(5+1);
    expect(order.join(',')).toBe('5,'+[...arr].reverse().filter(el => el!==5).join(','));
  })
});
