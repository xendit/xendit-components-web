import { ComponentChildren } from "preact";

export type ActionCardProps = {
  children: ComponentChildren;
  color: string;
  iconSrc?: string;
  actionText: string;
  removePadding?: boolean;
};

export function ActionCard(props: ActionCardProps) {
  return (
    <div
      className="xendit-action-card"
      style={{ backgroundColor: props.color ?? "#000" }}
    >
      <div className="xendit-action-card-text">
        {props.iconSrc ? (
          <img className="xendit-action-card-icon" src={props.iconSrc} alt="" />
        ) : null}
        <span className="xendit-text-12 xendit-text-inverse xendit-text-semibold">
          {props.actionText}
        </span>
      </div>
      <div
        className="xendit-action-card-inner-content"
        style={{
          padding: props.removePadding ? 0 : null,
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
