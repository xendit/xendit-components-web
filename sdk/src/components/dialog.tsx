import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
import Icon from "./icon";

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
  children?: React.ReactNode;
};

export const Dialog: React.FC<Props> = (props) => {
  const { title, onClose, children } = props;

  const closeCalledRef = useRef(false);
  const closeAnimationPlaying = useRef(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

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

    backdropRef.current.animate(backdropFadeOutKeyframes, animationOptions);
    const animation = dialogRef.current.animate(
      foregroundFadeOutKeyframes,
      animationOptions,
    );
    animation.onfinish = onCloseSafe;
  }, [onCloseSafe]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Close dialog only if the backdrop itself is clicked, not the dialog content
      if (event.target === event.currentTarget) {
        onCloseWithAnimation();
      }
    },
    [onCloseWithAnimation],
  );

  // play fade-in animation
  useLayoutEffect(() => {
    backdropRef.current?.animate(backdropFadeKeyframes, animationOptions);
    dialogRef.current?.animate(foregroundFadeKeyframes, animationOptions);
  }, []);

  useLayoutEffect(() => {
    if (props.close) {
      onCloseWithAnimation();
    }
  }, [props.close, onCloseWithAnimation]);

  return (
    <div
      className="xendit-dialog-backdrop"
      onClick={handleBackdropClick}
      ref={backdropRef}
    >
      <div className="xendit-dialog" ref={dialogRef}>
        <div className="xendit-dialog-header xendit-text-16 xendit-text-semibold">
          {title}
          <button aria-label="Close" onClick={onCloseWithAnimation}>
            <Icon name="x" size={24} />
          </button>
        </div>
        <div className="xendit-dialog-body">{children}</div>
      </div>
    </div>
  );
};

const animationOptions: EffectTiming = {
  duration: 200,
  easing: "ease-in-out",
  fill: "forwards",
};

const backdropFadeKeyframes: Keyframe[] = [
  {
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
];
const backdropFadeOutKeyframes = backdropFadeKeyframes.slice().reverse();

const foregroundFadeKeyframes: Keyframe[] = [
  {
    opacity: 0,
    transform: `scale(0.9) translateY(-20px)`,
  },
  {
    opacity: 1,
    transform: "",
  },
];
const foregroundFadeOutKeyframes = foregroundFadeKeyframes.slice().reverse();
