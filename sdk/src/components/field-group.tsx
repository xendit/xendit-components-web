import { useState, useLayoutEffect, useRef } from "preact/hooks";
import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import Field from "./field";
import classNames from "classnames";
import { formFieldName } from "../utils";
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

  const fieldGroupSpans = fieldGroup.map((f) => f.span);
  const groupRowCount = Math.ceil(
    fieldGroup.reduce((agg, field) => agg + field.span, 0) / 2,
  );

  const calculateFieldPosition = (index: number) => {
    const fieldPositionBySpan = fieldGroupSpans
      .slice(0, index)
      .reduce((agg, span) => agg + span, 0);
    const fieldRow = index === 0 ? 0 : Math.floor(fieldPositionBySpan / 2);
    const fieldColumn = fieldPositionBySpan % 2;
    const isLastRow = fieldRow === groupRowCount - 1;

    return { fieldPositionBySpan, fieldRow, fieldColumn, isLastRow };
  };

  const getFieldClassNames = (
    field: ChannelFormField,
    index: number,
    position: ReturnType<typeof calculateFieldPosition>,
  ) => {
    const { fieldPositionBySpan, fieldRow, fieldColumn, isLastRow } = position;
    return classNames({
      [CSS_CLASSES.BOTTOM_LEFT_0]:
        groupRowCount > fieldRow + 1 || fieldPositionBySpan % 2 === 1,
      [CSS_CLASSES.BOTTOM_RIGHT_0]: !!fieldGroupSpans[index + 1],
      [CSS_CLASSES.TOP_LEFT_0]: index > 0,
      [CSS_CLASSES.TOP_RIGHT_0]:
        !(fieldRow === 0 && fieldColumn === 1) &&
        !(fieldRow === 0 && fieldColumn === 0 && field.span === 2),
      [CSS_CLASSES.COLLAPSE_RIGHT]: field.span === 1 && fieldColumn === 0,
      [CSS_CLASSES.COLLAPSE_LEFT]: field.span === 1 && fieldColumn === 1,
      [CSS_CLASSES.COLLAPSE_TOP]: fieldPositionBySpan >= 2,
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
      <label htmlFor={formFieldName(fieldGroup[0])} className="xendit-text-14">
        {fieldGroup[0].group_label ?? fieldGroup[0].label ?? ""}
      </label>
      <div
        ref={groupContainerRef}
        key={groupIndex}
        className={`xendit-form-field-group ${error ? "invalid" : ""}`}
      >
        {fieldGroup.map((field, index) => {
          const position = calculateFieldPosition(index);
          const className = getFieldClassNames(field, index, position);

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

export default FieldGroup;
