import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useList = <T extends (...args: any) => Promise<any>>(asyncFn: T) => {
  const [objects, setObjects] = useState<ReturnType<T> extends Promise<infer R> ? R : never>();
  useEffect(() => {
    asyncFn().then((r) => {
      setObjects(r);
    });
  }, [asyncFn]);
  return objects;
};
