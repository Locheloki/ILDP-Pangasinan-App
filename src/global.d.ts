declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react/jsx-runtime' {
  const jsx: any;
  export default jsx;
}

declare module 'react';

declare namespace React {
  function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  function useState<S = undefined>(): [S | undefined, (value: S | ((prev: S | undefined) => S | undefined)) => void];
  type CSSProperties = { [key: string]: any };
  type FormEvent = any;
  type ChangeEvent<T = any> = any;
}
