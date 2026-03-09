import { FunctionComponent } from "preact";

type Props = {
  title: string;
  subtitle?: string;
  logoUrl: string;
  logoAlt: string;
  redirectUrl: string | null;
  redirectButtonLabel: string | null;
};

const RedirectInstructions: FunctionComponent<Props> = (props) => {
  return (
    <div className="xendit-redirect-instructions">
      <div className="xendit-redirect-instructions-logo">
        <img src={props.logoUrl} alt={props.logoAlt} />
      </div>

      <div className="xendit-redirect-instructions-text">
        <div className="xendit-text-16">{props.title}</div>
        {props.subtitle ? (
          <div className="xendit-text-14 xendit-text-secondary">
            {props.subtitle}
          </div>
        ) : null}
      </div>

      {props.redirectUrl ? (
        <a
          href={props.redirectUrl}
          className="xendit-redirect-instructions-button xendit-text-14"
        >
          {props.redirectButtonLabel ?? ""}
        </a>
      ) : null}
    </div>
  );
};

export { RedirectInstructions };
