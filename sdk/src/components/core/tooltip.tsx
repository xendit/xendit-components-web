import { createContext, FunctionComponent } from "preact";
import { useContext, useState } from "preact/hooks";

export const TooltipContext = createContext<{
  fire: (text: string) => void;
  text: string;
}>({
  fire: () => {},
  text: "",
});

export const TooltipProvider: FunctionComponent = ({ children }) => {
  const [text, setText] = useState("");

  const fire = (text: string) => {
    setText(text);
    const timeout = setTimeout(() => {
      setText("");
    }, 2000);
    return () => clearTimeout(timeout);
  };

  return (
    <TooltipContext.Provider value={{ text, fire }}>
      <div style={{ position: "relative" }}>{children}</div>
    </TooltipContext.Provider>
  );
};

export const Tooltip: FunctionComponent = () => {
  const { text } = useContext(TooltipContext);

  if (!text) {
    return null;
  }

  return <div className="xendit-tooltip">{text}</div>;
};
