import {
  ComponentChildren,
  createContext,
  FunctionComponent,
  RefObject,
} from "preact";
import { IframeEvent } from "../../../shared/types";
import { useRef } from "preact/hooks";
import { assert } from "../utils";

interface IframeRegistry {
  registerIframe: (
    fieldName: string,
    iframeRef: RefObject<HTMLIFrameElement>,
  ) => void;
  unregisterIframe: (fieldName: string) => void;
  postMessageToIframe: (fieldName: string, message: IframeEvent) => void;
}

export const IframeRegistryContext = createContext<IframeRegistry | null>(null);

// read iframe data from environment variable
assert(process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL);
const parsedIframeUrl = new URL(
  process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL,
);
const IFRAME_ORIGIN = parsedIframeUrl.origin;

export const IframeRegistryProvider: FunctionComponent<{
  children: ComponentChildren;
}> = ({ children }) => {
  const iframeRegistry = useRef<Map<string, HTMLIFrameElement>>(new Map());

  const iframeRegistryValue: IframeRegistry = {
    registerIframe: (fieldName, ref) => {
      if (ref.current) iframeRegistry.current.set(fieldName, ref.current);
    },
    unregisterIframe: (fieldName) => iframeRegistry.current.delete(fieldName),
    postMessageToIframe: (fieldName, message) => {
      const iframe = iframeRegistry.current.get(fieldName);
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, IFRAME_ORIGIN);
      }
    },
  };

  return (
    <IframeRegistryContext.Provider value={iframeRegistryValue}>
      {children}
    </IframeRegistryContext.Provider>
  );
};
