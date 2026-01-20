import { useCallback } from "preact/hooks";
import Icon from "./icon";
import classNames from "classnames";
import {
  ComponentChildren,
  FunctionComponent,
  TargetedKeyboardEvent,
} from "preact";

interface Props {
  id: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  open: boolean;
  onClick: (id: string) => void;
  children: ComponentChildren;
}

export const AccordionItem: FunctionComponent<Props> = (props) => {
  const { id, title, subtitle, disabled, open, onClick, children } = props;

  const chevronDirection = open ? "up" : "down";

  const toggleOpen = useCallback(() => {
    if (disabled) {
      return;
    }
    onClick(id);
  }, [disabled, onClick, id]);

  const handleKeyPress = useCallback(
    (event: TargetedKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        toggleOpen();
        event.preventDefault();
      }
    },
    [toggleOpen],
  );

  const handleClick = useCallback(() => {
    toggleOpen();
  }, [toggleOpen]);

  return (
    <div
      className={classNames(
        "xendit-accordion-item",
        disabled ? "xendit-accordion-item-disabled" : "",
        open ? "xendit-accordion-item-open" : "xendit-accordion-item-closed",
      )}
    >
      <div
        className="xendit-accordion-item-header"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <Icon
          className="xendit-accordion-item-header-icon"
          name="dummy"
          size={24}
        />
        <div className="xendit-accordion-item-header-title xendit-text-16 xendit-text-bold">
          {title}
          {subtitle ? (
            <div className="xendit-accordion-item-header-subtitle xendit-text-14">
              {subtitle}
            </div>
          ) : null}
        </div>
        <Icon
          className="xendit-accordion-item-chevron"
          name="chevron"
          size={24}
          direction={chevronDirection}
        />
      </div>
      <div className="xendit-accordion-item-content" inert={!open}>
        <div className="xendit-accordion-item-padding">{children}</div>
      </div>
    </div>
  );
};
