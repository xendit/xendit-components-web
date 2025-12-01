import React, { useCallback } from "react";
import Icon from "./icon";
import classNames from "classnames";

interface Props {
  id: number;
  title: string;
  open: boolean;
  onClick: (id: number) => void;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<Props> = (props) => {
  const { id, title, open, onClick, children } = props;

  const chevronDirection = open ? "up" : "down";

  const toggleOpen = useCallback(() => {
    onClick(id);
  }, [onClick, id]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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
        open ? "xendit-accordion-item-open" : "xendit-accordion-item-closed",
      )}
    >
      <div
        className="xendit-accordion-item-header"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        role="button"
        tabIndex={0}
      >
        <Icon
          className="xendit-accordion-item-header-icon"
          name="dummy"
          size={24}
        />
        <div className="xendit-accordion-item-header-title xendit-text-16 xendit-text-bold">
          {title}
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
