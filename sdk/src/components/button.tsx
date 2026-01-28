import classNames from "classnames";
import { FunctionComponent } from "preact";

export enum ButtonVariant {
  BARE = "bare",
  PRIMARY_ROUNDED = "primary-rounded",
  WHITE_ROUNDED = "white-rounded",
}

type Props = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  variant: ButtonVariant;
};

export const Button: FunctionComponent<Props> = (props) => {
  const { children, variant, type = "button", ...rest } = props;

  const buttonVariantClass = {
    [ButtonVariant.BARE]: undefined,
    [ButtonVariant.PRIMARY_ROUNDED]: "xendit-button-primary-rounded",
    [ButtonVariant.WHITE_ROUNDED]: "xendit-button-white-rounded",
  }[variant];

  return (
    <button
      {...rest}
      className={classNames(
        props.className,
        "xendit-button",
        buttonVariantClass,
      )}
      type={type}
    >
      {children}
    </button>
  );
};

export const ButtonLoadingSpinner = () => {
  const angle1 = Math.PI * 0.4;
  const angle2 = 0;
  const radius = 0.4;
  const start = { x: Math.cos(angle1) * radius, y: Math.sin(angle1) * radius };
  const end = { x: Math.cos(angle2) * radius, y: Math.sin(angle2) * radius };

  return (
    <svg className="xendit-button-loading-spinner" viewBox="-0.5 -0.5 1 1">
      <path
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.1"
        strokeLinecap="round"
      ></path>
    </svg>
  );
};
