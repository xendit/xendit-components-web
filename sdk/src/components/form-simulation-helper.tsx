import { ComponentChildren, createContext, FunctionComponent } from "preact";
import { useContext, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Scenarios } from "../data/simulation-scenarios";
import { useSdk } from "./session-provider";
import { assert } from "../utils";

interface Props {
  scenarios: Scenarios;
  onSelect: (scenarioName: string) => void;
  children: ComponentChildren;
}

const FormSimulationHelperContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  scenarios: Scenarios;
  onSelect: (scenarioName: string) => void;
} | null>(null);

export const FormSimulationHelper: FunctionComponent<Props> = ({
  scenarios,
  onSelect,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef}>
      <FormSimulationHelperContext.Provider
        value={{ open, setOpen, scenarios, onSelect }}
      >
        {children}
      </FormSimulationHelperContext.Provider>
    </div>
  );
};

export const FormSimulationRoot: FunctionComponent<{
  children: ComponentChildren;
}> = ({ children }) => {
  return <div className="xendit-form-simulation-root">{children}</div>;
};

export const FormSimulationTrigger: FunctionComponent<{
  children: ComponentChildren;
}> = ({ children }) => {
  const { open, setOpen } = useContext(FormSimulationHelperContext) || {};

  return (
    <button
      type="button"
      className="xendit-form-simulation-trigger"
      onClick={() => setOpen?.(!open)}
    >
      {children}
    </button>
  );
};

export const FormSimulationHelperPopover: FunctionComponent = () => {
  const simulateHelper = useContext(FormSimulationHelperContext);
  assert(simulateHelper);
  const { open, setOpen, scenarios, onSelect } = simulateHelper;
  const { t } = useSdk();
  const listRef = useRef<HTMLUListElement>(null);

  // move focus to the first option as soon as the popover opens, so arrow keys work immediately
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector("button")?.focus();
  }, [open]);

  const onListKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const buttons = Array.from(
      listRef.current?.querySelectorAll("button") ?? [],
    );
    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      e.key === "ArrowDown"
        ? Math.min(buttons.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    buttons[nextIndex]?.focus();
  };

  if (!open || !scenarios) {
    return null;
  }

  return (
    <div className="xendit-form-simulation-popover">
      <div className="xendit-text-12 xendit-text-semibold">
        {t("simulation.simulate_test_scenario")}
      </div>
      <ul
        ref={listRef}
        className="xendit-form-simulation-list"
        onKeyDown={onListKeyDown}
      >
        {scenarios.scenarios.map((scenario) => (
          <li key={scenario.name}>
            <button
              type="button"
              className="xendit-dropdown-item xendit-dropdown-has-asset xendit-text-14"
              onClick={() => {
                onSelect?.(scenario.name);
                setOpen?.(false);
              }}
            >
              <img src={scenario.imageUrl} className="xendit-channel-logo" />
              <div className="xendit-dropdown-item-text xendit-text-14">
                <span className="xendit-dropdown-item-title">
                  {scenario.description}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {scenarios?.docsLink ? (
        <div className="xendit-text-14">
          {t("simulation.want_to_test_all_scenarios")}{" "}
          <a
            href={scenarios.docsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="xendit-text-link"
          >
            {t("simulation.see_all_scenarios")}
          </a>
        </div>
      ) : null}
    </div>
  );
};
