import { ComponentChildren, createContext, FunctionComponent } from "preact";
import { useContext, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Scenarios } from "../data/simulation-scenarios";
import { Dropdown } from "./dropdown";
import { useSdk } from "./session-provider";

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
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
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
  const { open, setOpen, scenarios, onSelect } =
    useContext(FormSimulationHelperContext) || {};
  const { t } = useSdk();

  if (!open || !scenarios) {
    return null;
  }

  return (
    <div className="xendit-form-simulation-popover">
      <div className="xendit-text-12 xendit-text-semibold">
        {t("simulation.simulate_test_scenario")}
      </div>
      <Dropdown
        onChange={(option) => {
          const selectedScenario = scenarios.scenarios.find(
            (scenario) => scenario.description === option.value,
          );
          if (selectedScenario) {
            onSelect?.(selectedScenario.name);
            setOpen?.(false);
          }
        }}
        placeholder={t("simulation.select_scenario")}
        options={scenarios.scenarios.map((scenario) => ({
          title: scenario.description,
          value: scenario.description,
          leadingAsset: (
            <img
              src={scenario.imageUrl}
              className="xendit-form-simulation-scenario-icon"
            />
          ),
        }))}
      />
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
