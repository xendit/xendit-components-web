import { createContext, FunctionComponent } from "preact";
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "preact/hooks";

export const TooltipContext = createContext<{
  fire: (text: string) => void;
  clear: () => void;
  text: string;
}>({
  fire: () => {},
  clear: () => {},
  text: "",
});

export const TooltipProvider: FunctionComponent = ({ children }) => {
  const [text, setText] = useState("");

  const fire = useCallback((text: string) => {
    setText(text);
    const timeout = setTimeout(() => {
      setText("");
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const clear = useCallback(() => {
    setText("");
  }, []);

  return (
    <TooltipContext.Provider value={{ text, fire, clear }}>
      <div style={{ position: "relative" }}>{children}</div>
    </TooltipContext.Provider>
  );
};

export const Tooltip: FunctionComponent = () => {
  const { text, clear } = useContext(TooltipContext);

  useLayoutEffect(() => {
    if (text) {
      const fn = () => {
        clear();
      };
      document.body.addEventListener("mousedown", fn);
      return () => {
        document.body.removeEventListener("mousedown", fn);
      };
    }
  }, [clear, text]);

  if (!text) {
    return null;
  }

  return <div className="xendit-tooltip">{text}</div>;
};
