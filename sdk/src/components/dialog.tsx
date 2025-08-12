import Icon from "./icon";

type Props = {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export const Dialog: React.FC<Props> = (props) => {
  const { title, onClose, children } = props;

  return (
    <div className="xendit-dialog-backdrop">
      <div className="xendit-dialog">
        <div className="xendit-dialog-header xendit-text-16 xendit-text-semibold">
          {title}
          <button aria-label="Close" onClick={onClose}>
            <Icon name="x" size={24} />
          </button>
        </div>
        <div className="xendit-dialog-body">{children}</div>
      </div>
    </div>
  );
};
