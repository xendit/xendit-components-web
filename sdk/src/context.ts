import { unsubscribe } from "diagnostics_channel";

export type Context<T> = {
  key: string | symbol;
  phantom?: T;
};

export type Provider<T> = {
  data: T | null;
  set: (this: Provider<T>, data: T) => void;
  get: (this: Provider<T>) => T | null;
  stopProviding: () => void;
  subscribers: Map<EventTarget, (data: T) => void>;
};

/** Create a context object */
export function createContext<T>(key: string | symbol): Context<T> {
  return { key };
}

/** Make an element provide the given context */
export function provideContext<T>(
  element: HTMLElement,
  context: Context<T>,
  initialValue?: T
): Provider<T> {
  let listener: (event: XenditContextRequestEvent<any>) => void;
  const provider: Provider<T> = {
    data: initialValue ?? null,
    set(data: T) {
      this.data = data;
      this.subscribers.forEach((callback) => callback(data));
    },
    get() {
      return this.data;
    },
    stopProviding: () => {
      element.removeEventListener("xendit-context-request", listener);
    },
    subscribers: new Map()
  };
  listener = (event: XenditContextRequestEvent<any>) => {
    if (!event.target) return;
    if (event.context.key !== context.key) {
      return;
    }
    event.stopPropagation();
    if (event.operation === "subscribe") {
      provider.subscribers.set(event.target, event.callback);
    }
    event.callback(provider.get());
  };
  element.addEventListener("xendit-context-request", listener);
  return provider;
}

export function subscribeContext<T>(
  element: EventTarget,
  context: Context<T>,
  callback: (data: T) => void
) {
  let result: T | null = null;
  let isFirst = true;
  element.dispatchEvent(
    new XenditContextRequestEvent<T>(context, "subscribe", (data) => {
      if (isFirst) {
        result = data;
      } else {
        callback(data);
      }
      isFirst = false;
    })
  );
  return result;
}

/** Get the value of a context (without subscribing) */
export function getContext<T>(
  element: EventTarget,
  context: Context<T>
): T | null {
  let result: T | null = null;
  element.dispatchEvent(
    new XenditContextRequestEvent<T>(context, "get", (data) => {
      result = data;
    })
  );
  return result;
}

export class XenditContextRequestEvent<T> extends Event {
  type = "xendit-context-request" as const;
  callback: (data: T) => void;
  operation: "get" | "subscribe" | "unsubscribe";
  context: Context<T>;

  constructor(
    context: Context<T>,
    operation: "get" | "subscribe" | "unsubscribe",
    callback: (data: T) => void
  ) {
    super("xendit-context-request", {
      bubbles: true,
      composed: true
    });
    this.context = context;
    this.operation = operation;
    this.callback = callback;
  }
}
