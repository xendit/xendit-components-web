import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";

export type ActionCardProps = {
  children: ComponentChildren;
  color: string;
  title?: string;
  channelBrandName: string;
  channelBrandLogoUrl: string;
  actionIconSrc?: string;
  actionText: string;
  removePadding?: boolean;
};

const ActionCardContext = createContext(false);

export function ActionCard(props: ActionCardProps) {
  return (
    <div className="xendit-action-card-wrapper">
      <div className="xendit-action-channel-info">
        <img
          className="xendit-action-channel-logo"
          src={props.channelBrandLogoUrl}
          alt=""
        />
        <div className="xendit-action-heading xendit-text-24 xendit-text-bold">
          {props.title || props.channelBrandName}
        </div>
      </div>
      <div
        className="xendit-action-card"
        style={{ backgroundColor: props.color ?? "#000" }}
      >
        <div className="xendit-action-card-text">
          {props.actionIconSrc ? (
            <img
              className="xendit-action-card-icon"
              src={props.actionIconSrc}
              alt=""
            />
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
          <ActionCardContext.Provider value={true}>
            {props.children}
          </ActionCardContext.Provider>
        </div>
      </div>
    </div>
  );
}

export function useActionCard() {
  return useContext(ActionCardContext);
}
