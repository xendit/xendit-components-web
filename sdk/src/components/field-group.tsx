import { useState, useLayoutEffect, useRef, useMemo } from "preact/hooks";
import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import Field from "./field";
import classNames from "classnames";
import { formFieldId, formFieldName } from "../utils";
import { useSdk } from "./session-provider";
import { getLocalizedErrorMessage } from "../localization";
import { channelPropertyFieldValidate } from "../validation";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

const CSS_CLASSES = {
  BOTTOM_LEFT_0: "field-radius-bl-0",
  BOTTOM_RIGHT_0: "field-radius-br-0",
  TOP_LEFT_0: "field-radius-tl-0",
  TOP_RIGHT_0: "field-radius-tr-0",
  COLLAPSE_RIGHT: "field-collapse-r",
  COLLAPSE_LEFT: "field-collapse-l",
  COLLAPSE_TOP: "field-collapse-t",
  COLLAPSE_BOTTOM: "field-collapse-b",
} as const;

interface Props {
  fieldGroup: ChannelFormField[];
  groupIndex: number;
  handleFieldChanged: () => void;
  channelProperties: ChannelProperties | null;
}

const FieldGroup = ({
  fieldGroup,
  groupIndex,
  handleFieldChanged,
  channelProperties,
}: Props) => {
  const { t } = useSdk();

  const groupContainerRef = useRef<HTMLDivElement>(null);

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const fieldPositions = useMemo(
    () => calculateFieldPositions(fieldGroup),
    [fieldGroup],
  );

  const getFieldClassNames = (field: ChannelFormField, index: number) => {
    const span = field.span;
    const { fieldColumn, isFirstRow, isLastRow } = fieldPositions[index];
    return classNames({
      // remove border radius on corners that are touching another corner
      [CSS_CLASSES.BOTTOM_LEFT_0]:
        !isLastRow || (span === 1 && fieldColumn === 1),
      [CSS_CLASSES.BOTTOM_RIGHT_0]:
        !isLastRow || (span === 1 && fieldColumn === 0),
      [CSS_CLASSES.TOP_LEFT_0]:
        !isFirstRow || (span === 1 && fieldColumn === 1),
      [CSS_CLASSES.TOP_RIGHT_0]:
        !isFirstRow || (span === 1 && fieldColumn === 0),

      // remove borders between fields
      [CSS_CLASSES.COLLAPSE_RIGHT]: field.span === 1 && fieldColumn === 0,
      [CSS_CLASSES.COLLAPSE_LEFT]: field.span === 1 && fieldColumn === 1,
      [CSS_CLASSES.COLLAPSE_TOP]: !isFirstRow,
      [CSS_CLASSES.COLLAPSE_BOTTOM]: !isLastRow,
    });
  };

  useLayoutEffect(() => {
    const containerElement = groupContainerRef.current;
    if (!containerElement) return;
    function listener(event: InternalSetFieldTouchedEvent) {
      // when a field is touched, add it to touched state
      const name = (event.target as HTMLInputElement).name;
      setTouchedFields((prev) => ({
        ...prev,
        [name]: true,
      }));
    }
    containerElement.addEventListener(
      InternalSetFieldTouchedEvent.type,
      listener,
    );
    return () => {
      containerElement.removeEventListener(
        InternalSetFieldTouchedEvent.type,
        listener,
      );
    };
  }, []);

  const renderError = () => {
    for (const field of fieldGroup) {
      if (!touchedFields[formFieldName(field)]) {
        // field not touched yet, skip validation
        // (this prevents showing validation errors too eagerly while the user is typing)
        continue;
      }

      const err = channelPropertyFieldValidate(field, channelProperties ?? {});
      if (!err) {
        // ok, no error
        continue;
      }

      // render first error and ignore the rest
      return (
        <span className="xendit-error-message xendit-text-12">
          {getLocalizedErrorMessage(t, err, field)}
        </span>
      );
    }
    return null;
  };

  const error = renderError();

  return (
    <div className="xendit-channel-form-field-group">
      <label htmlFor={formFieldId(fieldGroup[0])} className="xendit-text-14">
        {fieldGroup[0].group_label ?? fieldGroup[0].label ?? ""}
      </label>
      <div
        ref={groupContainerRef}
        key={groupIndex}
        className={`xendit-form-field-group ${error ? "invalid" : ""}`}
      >
        {fieldGroup.map((field, index) => {
          const className = getFieldClassNames(field, index);

          return (
            <Field
              className={className}
              key={index}
              field={field}
              onChange={handleFieldChanged}
            />
          );
        })}
      </div>
      {error}
    </div>
  );
};

export function calculateFieldPositions(fieldsInGroup: ChannelFormField[]) {
  const fieldPositions: {
    fieldRow: number;
    fieldColumn: number;
    isFirstRow: boolean;
    isLastRow: boolean;
  }[] = [];
  let cursor = 0;
  for (let i = 0; i < fieldsInGroup.length; i++) {
    const fieldRow = Math.floor(cursor / 2);
    const fieldColumn = cursor % 2;
    fieldPositions.push({
      fieldRow,
      fieldColumn,
      isFirstRow: fieldRow === 0,
      isLastRow: false,
    });
    cursor += fieldsInGroup[i].span;
  }
  let i = fieldPositions.length;
  const lastRow = fieldPositions[fieldPositions.length - 1];
  while (i--) {
    if (fieldPositions[i].fieldRow === lastRow.fieldRow) {
      fieldPositions[i].isLastRow = true;
    } else {
      break;
    }
  }
  return fieldPositions;
}

export default FieldGroup;
