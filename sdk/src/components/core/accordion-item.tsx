import classNames from "classnames";
import {
  ComponentChildren,
  FunctionComponent,
  TargetedKeyboardEvent,
} from "preact";
import { useCallback } from "preact/hooks";

interface Props {
  id: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  open: boolean;
  onClick: (id: string) => void;
  children: ComponentChildren;
  channelLogos: {
    src: string;
    alt: string;
    enabled: boolean;
  }[];
}

export const AccordionItem: FunctionComponent<Props> = (props) => {
  const {
    id,
    title,
    subtitle,
    disabled,
    open,
    onClick,
    children,
    channelLogos,
  } = props;

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
        <RadioButtonGraphic selected={open} />
        <div className="xendit-accordion-item-header-title xendit-text-14">
          {title}
          {subtitle ? (
            <div className="xendit-accordion-item-header-subtitle xendit-text-14">
              {subtitle}
            </div>
          ) : null}
        </div>
        <GroupLogos logos={channelLogos} />
      </div>
      <div className="xendit-accordion-item-content" inert={!open}>
        <div className="xendit-accordion-item-padding">{children}</div>
      </div>
    </div>
  );
};

type RadioButtonGraphicProps = {
  selected: boolean;
};

const RadioButtonGraphic = (props: RadioButtonGraphicProps) => {
  const { selected } = props;
  const strokeWidth = selected ? 5 : 1;
  const radius = 8 - strokeWidth / 2;
  return (
    <svg
      viewBox="-8 -8 16 16"
      width={16}
      height={16}
      aria-hidden="true"
      style={{
        fill: "none",
        stroke: selected
          ? "var(--xendit-color-primary)"
          : "var(--xendit-color-border)",
      }}
    >
      <circle cx="0" cy="0" strokeWidth={strokeWidth} r={radius} />
    </svg>
  );
};

const MAX_LOGO_COUNT = 4; // Maximum logos to display before showing a count

type GroupLogosProps = {
  logos: {
    src: string;
    alt: string;
    enabled: boolean;
  }[];
};

export const GroupLogos = (props: GroupLogosProps) => {
  const { logos } = props;

  // Generate logos for the payment channels
  const logoNodes: ComponentChildren[] = [];
  let logoIndex = 1;

  for (const logo of logos) {
    // else use channel brand logo
    logoNodes.push(
      <img
        key={logoIndex++}
        src={logo.src}
        alt={logo.alt}
        // onError={hideOnError}
        className={classNames("xendit-accordion-item-logo-image", {
          "xendit-accordion-item-logo-image-disabled": !logo.enabled,
        })}
      />,
    );
  }

  // Truncate logos list if they exceed the maximum count
  if (logos.length > MAX_LOGO_COUNT) {
    const excessLogos = logos.length - MAX_LOGO_COUNT + 1;
    logoNodes.splice(MAX_LOGO_COUNT - 1, excessLogos, `+${excessLogos}`);
  }

  if (logos.length === 0) {
    return null;
  }

  return (
    <div className="xendit-accordion-item-logos">
      {logoNodes.map((logo, index) => (
        <div key={index} className="xendit-accordion-item-logo-container">
          {logo}
        </div>
      ))}
    </div>
  );
};
