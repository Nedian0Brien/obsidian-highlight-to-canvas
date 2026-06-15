export type PdfJsLib = typeof import("pdfjs-dist");

interface PromiseWithResolversLike<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

interface PromiseConstructorWithResolvers extends PromiseConstructor {
  withResolvers?: <T>() => PromiseWithResolversLike<T>;
}

export async function loadPdfJs(): Promise<PdfJsLib> {
  ensurePromiseWithResolvers();
  return import("pdfjs-dist");
}

function ensurePromiseWithResolvers(): void {
  const promiseConstructor = Promise as PromiseConstructorWithResolvers;
  if (promiseConstructor.withResolvers) return;

  promiseConstructor.withResolvers = function withResolvers<T>(): PromiseWithResolversLike<T> {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });
    return { promise, resolve, reject };
  };
}
