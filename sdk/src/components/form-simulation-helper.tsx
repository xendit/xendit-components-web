import { ComponentChildren, createContext, FunctionComponent } from "preact";
import { useContext, useState } from "preact/hooks";
import { Scenarios } from "../data/simulation-scenarios";
import { Dropdown } from "./dropdown";

interface Props {
  scenarios: Scenarios;
  onSelect: (values: { [key: string]: string }) => void;
  children: ComponentChildren;
}

const FormSimulationHelperContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  scenarios: Scenarios;
  onSelect: (values: { [key: string]: string }) => void;
} | null>(null);

export const FormSimulationHelper: FunctionComponent<Props> = ({
  scenarios,
  onSelect,
  children,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FormSimulationHelperContext.Provider
      value={{ open, setOpen, scenarios, onSelect }}
    >
      {children}
    </FormSimulationHelperContext.Provider>
  );
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
  const { open, scenarios, onSelect } =
    useContext(FormSimulationHelperContext) || {};

  if (!open || !scenarios) {
    return null;
  }

  return (
    <div className="xendit-form-simulation-popover">
      <div className="xendit-text-12 xendit-text-semibold">
        Simulate a test scenario
      </div>
      <Dropdown
        onChange={(option) => {
          const selectedScenario = scenarios.scenarios.find(
            (scenario) => scenario.description === option.value,
          );
          if (selectedScenario) {
            onSelect?.(selectedScenario.values);
          }
        }}
        placeholder="Select a scenario"
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
          Want to test different scenarios? See the full list{" "}
          <a
            href={scenarios.docsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="xendit-text-link"
          >
            here
          </a>
          .
        </div>
      ) : null}
    </div>
  );
};
