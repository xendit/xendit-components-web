import React, { useContext, useCallback, useId } from "react";
import { AccordionContext } from "./accordion";
import Icon from "./icon";

interface Props {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  open?: boolean;
}

export const AccordionItem: React.FC<Props> = ({
  open = false,
  title = "",
  children,
  onClick
}) => {
  const id = useId();
  const { selectedItem, setSelectedItem } = useContext(AccordionContext);

  const isOpen = open || selectedItem === id;
  const containerOpenClass = isOpen
    ? "xendit-accordion-item-open"
    : "xendit-accordion-item-closed";
  const chevronDirection = isOpen ? "down" : "up";

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        setSelectedItem(id);
        onClick();
      }
    },
    [onClick, setSelectedItem]
  );

  const handleClick = useCallback(() => {
    setSelectedItem(id);
    onClick();
  }, [onClick, setSelectedItem]);

  return (
    <div className="xendit-accordion-item">
      <div
        className="xendit-accordion-item-header"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        role="button"
        tabIndex={0}
      >
        <Icon name="dummy" size={24} />
        <div className="xendit-accordion-item-header-title xendit-text-16">
          {title}
        </div>
        <Icon name="chevron" size={24} direction={chevronDirection} />
      </div>
      <div className={`xendit-accordion-item-content ${containerOpenClass}`}>
        {children}
      </div>
    </div>
  );
};
