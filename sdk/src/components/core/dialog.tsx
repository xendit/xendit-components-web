import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
import Icon from "../icon";
import { ComponentChildren, FunctionComponent, TargetedEvent } from "preact";

type Props = {
  /**
   * Title shown above the border.
   */
  title: string;
  /**
   * Called on close (after animation).
   */
  onClose: () => void;
  /**
   * If true, close the dialog on the next render. The animation will play then onClose will be called.
   */
  close?: boolean;
  children?: ComponentChildren;
  /**
   * if true, the header will float on top of the body content without a dividing line
   */
  seamless?: boolean;
  /**
   * Remove padding on body element.
   */
  noPadding?: boolean;
  /**
   * Remove close button. It must be closed by firing an event or rendering with close=true.
   */
  noCloseButton?: boolean;
  /**
   * Borders of the dialog.
   */
  borderColor?: string;
};

export const Dialog: FunctionComponent<Props> = (props) => {
  const { title, onClose, children, seamless, borderColor, noCloseButton } =
    props;

  const closeCalledRef = useRef(false);
  const closeAnimationPlaying = useRef(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const supportsAnimation = HTMLElement.prototype.animate !== undefined;

  // call close callback only once
  const onCloseSafe = useCallback(() => {
    if (closeCalledRef.current) return;
    closeCalledRef.current = true;
    onClose();
  }, [onClose]);

  // play fade-out animation then call close callback
  const onCloseWithAnimation = useCallback(() => {
    if (
      !dialogRef.current ||
      !backdropRef.current ||
      closeAnimationPlaying.current
    ) {
      return;
    }
    closeAnimationPlaying.current = true;

    if (!supportsAnimation) {
      onCloseSafe();
      return;
    }

    backdropRef.current.animate?.(
      backdropFadeOutKeyframes,
      animationOptionsOut,
    );
    const animation = dialogRef.current.animate?.(
      foregroundFadeOutKeyframes,
      animationOptionsOut,
    );
    animation.onfinish = onCloseSafe;
  }, [onCloseSafe, supportsAnimation]);

  // play fade-in animation
  useLayoutEffect(() => {
    if (!supportsAnimation) {
      return;
    }

    backdropRef.current?.animate?.(backdropFadeKeyframes, animationOptionsIn);
    dialogRef.current?.animate?.(foregroundFadeKeyframes, animationOptionsIn);
  }, [supportsAnimation]);

  // handle close event
  useLayoutEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const handleCloseEvent = (event: Event) => {
      onCloseWithAnimation();
    };
    el.addEventListener(InternalDialogCloseEvent.eventName, handleCloseEvent);
    return () => {
      el.removeEventListener(
        InternalDialogCloseEvent.eventName,
        handleCloseEvent,
      );
    };
  }, [onCloseWithAnimation]);

  const onCloseButtonClick = useCallback((e: TargetedEvent) => {
    e.target?.dispatchEvent(new InternalDialogCloseEvent());
  }, []);

  // close if rerendered with close=true
  useLayoutEffect(() => {
    if (props.close) {
      onCloseWithAnimation();
    }
  }, [props.close, onCloseWithAnimation]);

  return (
    <div className="xendit-dialog-backdrop" ref={backdropRef}>
      <div
        className={`xendit-dialog`}
        ref={dialogRef}
        style={borderColor ? { border: `4px solid ${borderColor}` } : undefined}
      >
        {!noCloseButton && !seamless ? (
          <div className="xendit-dialog-header xendit-text-16 xendit-text-semibold">
            {title}
            <button aria-label="Close" onClick={onCloseWithAnimation}>
              <Icon name="x" size={20} />
            </button>
          </div>
        ) : null}
        <div
          className="xendit-dialog-body"
          style={props.noPadding ? { padding: "0" } : undefined}
        >
          {children}
        </div>
        {!noCloseButton && seamless ? (
          <button
            aria-label="Close"
            onClick={onCloseButtonClick}
            className="xendit-dialog-floating-close"
          >
            <Icon name="x" size={20} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export class InternalDialogCloseEvent extends Event {
  static eventName = "xendit-internal-dialog-close";
  constructor() {
    super(InternalDialogCloseEvent.eventName, { bubbles: true });
  }
}

const animationOptionsIn: EffectTiming = {
  duration: 500,
  easing: "cubic-bezier(.32,.23,0,.92)",
  fill: "forwards",
};

const animationOptionsOut: EffectTiming = {
  duration: 200,
  easing: "linear",
  fill: "forwards",
};

const backdropFadeKeyframes: Keyframe[] = [
  {
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    offset: 0.1,
  },
  {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
];
const backdropFadeOutKeyframes = backdropFadeKeyframes.slice().reverse();

const foregroundFadeKeyframes: Keyframe[] = [
  {
    opacity: 0,
    transform: `scale(0.98) translateY(-40px) rotateX(15deg)`,
  },
  {
    opacity: 0,
    transform: `scale(0.98) translateY(-40px) rotateX(15deg)`,
  },
  {
    opacity: 1,
    transform: "",
  },
];

const foregroundFadeOutKeyframes: Keyframe[] = [
  {
    opacity: 1,
    transform: "",
  },
  {
    opacity: 0,
    transform: `scale(0.92) translateY(-10px)`,
  },
];
