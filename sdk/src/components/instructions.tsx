import { ComponentChildren, Fragment, FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import {
  FormattedString,
  InstructionsStep,
  InstructionsTab,
  Instructions as InstructionsType,
} from "../backend-types/instructions";
import classNames from "classnames";

type Props = {
  instructions: InstructionsType;
};

export const Instructions: FunctionComponent<Props> = ({ instructions }) => {
  switch (instructions.length) {
    case 0:
      return null;
    case 1:
      return <SingleTabInstructions instruction={instructions[0]} />;
    default:
      return <MultiTabInstructions instructions={instructions} />;
  }
};

export const SingleTabInstructions: FunctionComponent<{
  instruction: InstructionsTab;
}> = (props) => {
  return (
    <div>
      <p className={"xendit-instructions-single-tab-heading"}>
        {props.instruction.title}
      </p>
      <InstructionsSteps instruction={props.instruction} />
    </div>
  );
};

const MultiTabInstructions: FunctionComponent<{
  instructions: InstructionsType;
}> = (props) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div>
      <div className={"xendit-instructions-tab-list"}>
        {props.instructions.map((instruction, index) => (
          <button
            key={index}
            className={classNames("xendit-instructions-tab-button", {
              ["xendit-instructions-active-tab"]: selectedTab === index,
            })}
            onClick={() => setSelectedTab(index)}
          >
            {instruction.title}
          </button>
        ))}
      </div>
      <InstructionsSteps instruction={props.instructions[selectedTab]} />
    </div>
  );
};

export const InstructionsSteps: FunctionComponent<{
  instruction: InstructionsTab;
}> = (props) => {
  return (
    <ol
      className={"xendit-instructions-numbered-list"}
      data-testid="instructions-steps"
    >
      {props.instruction.content.map((step, index) => {
        const stepItems = Array.isArray(step) ? step : [step];
        return (
          <li className={"xendit-instructions-step-li"} key={index}>
            <div className={"xendit-instructions-step-box"}>
              {stepItems.map((s, i) => (
                <Fragment key={i}>{renderStep(s)}</Fragment>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

function renderFormattedStringElement(
  el: Element,
  i: number,
): ComponentChildren {
  const className = classNames({
    ["xendit-instructions-bold"]: el.nodeName === "B",
    ["xendit-instructions-italics"]: el.nodeName === "I",
  });

  // render the children without wrapping if this is an element we don't want
  if (!className) return renderFormattedStringChildren(el.childNodes);

  return (
    <span className={className} key={i}>
      {renderFormattedStringChildren(el.childNodes)}
    </span>
  );
}

function renderFormattedStringChildren(nodes: NodeListOf<ChildNode>) {
  const parts = Array.from(nodes);
  const renderedNodes = parts.map((part, i) => {
    switch (part.nodeType) {
      case Node.TEXT_NODE:
        if (part.textContent === null) return null;
        return part.textContent;
      case Node.ELEMENT_NODE:
        return renderFormattedStringElement(part as Element, i);
      default:
        return null;
    }
  });
  return renderedNodes;
}

const domParser = new DOMParser();

function renderFormattedString(text: FormattedString): ComponentChildren {
  try {
    const doc = domParser.parseFromString(text, "text/html");
    return renderFormattedStringChildren(doc.body.childNodes);
  } catch (_) {
    return text;
  }
}

function renderStep(step: string | InstructionsStep): ComponentChildren {
  if (typeof step === "string") {
    return (
      <p className={"xendit-instructions-step-item"}>
        {renderFormattedString(step)}
      </p>
    );
  }

  switch (step.type) {
    case "text":
      return renderTextStep(step);
    case "image":
      return renderImageStep(step);
    case "bullets":
      return renderBulletsStep(step);
    case "form":
      return renderFormStep(step);
    case "table":
      return renderTableStep(step);
  }

  return null;
}

function renderTextStep(step: Extract<InstructionsStep, { type: "text" }>) {
  return <p>{renderFormattedString(step.text)}</p>;
}

function renderImageStep(step: Extract<InstructionsStep, { type: "image" }>) {
  return (
    <div>
      <img
        src={step.src}
        alt={step.alt || ""}
        style={{ height: `${step.height ?? 24}px` }}
      />
    </div>
  );
}

function renderBulletsStep(
  step: Extract<InstructionsStep, { type: "bullets" }>,
) {
  return (
    <ul className={"xendit-instructions-bullet-list"}>
      {step.items.map((item, index) => (
        <li key={index}>{renderFormattedString(item)}</li>
      ))}
    </ul>
  );
}

function renderFormStep(step: Extract<InstructionsStep, { type: "form" }>) {
  return (
    <div className={"xendit-instructions-form-card"}>
      {step.heading ? (
        <h3 className={"xendit-instructions-form-heading"}>
          {renderFormattedString(step.heading)}
        </h3>
      ) : null}
      {step.fields.map((field, index) => (
        <div className={"xendit-instructions-form-field"} key={index}>
          <div className={"xendit-instructions-form-field-label"}>
            {renderFormattedString(field.label)}
          </div>
          <div className={"xendit-instructions-form-field-value"}>
            {renderFormattedString(field.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTableStep(step: Extract<InstructionsStep, { type: "table" }>) {
  return (
    <table className={"xendit-instructions-table"}>
      <thead>
        <tr>
          {step.headers.map((header, index) => (
            <th className={"xendit-instructions-table-header"} key={index}>
              {renderFormattedString(header)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {step.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td className={"xendit-instructions-table-cell"} key={cellIndex}>
                {renderFormattedString(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
