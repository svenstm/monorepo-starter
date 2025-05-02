const isError = (e: unknown): e is Error => Object.prototype.hasOwnProperty.call(e, 'stack');


function clearStack(stack: string, linesToRemove = 0) {
  // Splice by line and reverse, popping and reversing twice is quicker than shifting 2 lines
  const errors = stack.split('\n').reverse();

  // Remove all text before the lines
  while(!errors[errors.length-1].match(/\w*at /)) {
    errors.pop();
  }

  // Remove lines by editing the length of the array
  if (linesToRemove) {
    errors.length -= linesToRemove;
  }

  errors.reverse()
  return errors;
}

export function errorToLines(e: Error|string|unknown, linesToRemove = 0) {

  let stack: string;
  if (isError(e)) {
    stack = e.stack;
  } else if (typeof e === 'string'){
    stack = e;
  } else {
    return [];
  }

  // Fix windows line endings if they are there
  stack = stack.replaceAll('\r','');

  return clearStack(stack, linesToRemove);
}

export function appendStack<T extends Error|unknown>(main: T, input: string|Error, text?:string, linesToRemove =0): T {
  // You can throw anything in js
  if (!isError(main)) {
    return main;
  }

  const stack = (isError(input) ? errorToLines(input, linesToRemove) : clearStack(input, linesToRemove)).join('\n');

  main.stack += '\n'+(text ? text +'\n' : '') + stack;
  return main;
}
