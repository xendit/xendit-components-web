import { FunctionComponent, SVGAttributes } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

export const QrScanIcon: FunctionComponent<SVGAttributes<SVGSVGElement>> = (
  props,
) => {
  const scannerRef = useRef<SVGRectElement>(null);
  const squareBackgroundRef = useRef<SVGRectElement>(null);

  const supportsAnimation = HTMLElement.prototype.animate !== undefined;

  useLayoutEffect(() => {
    if (!supportsAnimation) {
      return;
    }
    if (scannerRef.current) {
      const startAnimation = () => {
        if (!scannerRef.current) return;
        const a = scannerRef.current.animate(
          scannerKeyFrames,
          scanDownAnimationOptions,
        );
        setTimeout(() => {
          squareBackgroundRef.current?.animate(
            squareKeyFrames,
            squareAnimationOptions,
          );
        }, 1000);
        a.onfinish = () => {
          const b = scannerRef.current?.animate(
            scannerKeyFrames,
            scanUpAnimationOptions,
          );
          setTimeout(() => {
            squareBackgroundRef.current?.animate(
              squareKeyFrames,
              squareAnimationOptions,
            );
          }, 500);
          if (b) b.onfinish = startAnimation;
        };
      };
      startAnimation();
    }
  }, [supportsAnimation]);

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_6698_4636)">
        {/* background */}
        <rect
          x="8"
          y="8"
          width="24"
          height="24"
          fill="#F1F1F1"
          ref={squareBackgroundRef}
        />

        <path
          d="M11.5 13.1528C11.5 12.24 12.24 11.5 13.1528 11.5H17.4028C18.3156 11.5 19.0556 12.24 19.0556 13.1528V17.4028C19.0556 18.3156 18.3156 19.0556 17.4028 19.0556H13.1528C12.24 19.0556 11.5 18.3156 11.5 17.4028V13.1528Z"
          fill="#7C7C7C"
        />
        <path
          d="M20.9444 13.1528C20.9444 12.24 21.6844 11.5 22.5972 11.5H26.8472C27.76 11.5 28.5 12.24 28.5 13.1528V17.4028C28.5 18.3156 27.76 19.0556 26.8472 19.0556H22.5972C21.6844 19.0556 20.9444 18.3156 20.9444 17.4028V13.1528Z"
          fill="#7C7C7C"
        />
        <path
          d="M11.5 22.5972C11.5 21.6844 12.24 20.9444 13.1528 20.9444H17.4028C18.3156 20.9444 19.0556 21.6844 19.0556 22.5972V26.8472C19.0556 27.76 18.3156 28.5 17.4028 28.5H13.1528C12.24 28.5 11.5 27.76 11.5 26.8472V22.5972Z"
          fill="#7C7C7C"
        />
        <path
          d="M20.9444 22.5972C20.9444 21.6844 21.6844 20.9444 22.5972 20.9444H26.8472C27.76 20.9444 28.5 21.6844 28.5 22.5972V26.8472C28.5 27.76 27.76 28.5 26.8472 28.5H22.5972C21.6844 28.5 20.9444 27.76 20.9444 26.8472V22.5972Z"
          fill="#7C7C7C"
        />
        <path
          d="M7.875 23C8.35825 23 8.75 23.3918 8.75 23.875V30.2754C8.75021 30.6755 9.07451 30.9998 9.47461 31H15.875C16.3582 31 16.75 31.3918 16.75 31.875C16.75 32.3582 16.3582 32.75 15.875 32.75H9.47461C8.10801 32.7498 7.00021 31.642 7 30.2754V23.875C7 23.3918 7.39175 23 7.875 23Z"
          fill="#7C7C7C"
        />
        <path
          d="M31.875 23C32.3582 23 32.75 23.3918 32.75 23.875V30.2754C32.7498 31.642 31.642 32.7498 30.2754 32.75H23.875C23.3918 32.75 23 32.3582 23 31.875C23 31.3918 23.3918 31 23.875 31H30.2754C30.6755 30.9998 30.9998 30.6755 31 30.2754V23.875C31 23.3918 31.3918 23 31.875 23Z"
          fill="#7C7C7C"
        />
        <path
          d="M15.875 7C16.3582 7 16.75 7.39175 16.75 7.875C16.75 8.35825 16.3582 8.75 15.875 8.75H9.47461C9.07451 8.75021 8.75021 9.07451 8.75 9.47461V15.875C8.75 16.3582 8.35825 16.75 7.875 16.75C7.39175 16.75 7 16.3582 7 15.875V9.47461C7.00021 8.10801 8.10801 7.00021 9.47461 7H15.875Z"
          fill="#7C7C7C"
        />
        <path
          d="M30.2754 7C31.642 7.00021 32.7498 8.10801 32.75 9.47461V15.875C32.75 16.3582 32.3582 16.75 31.875 16.75C31.3918 16.75 31 16.3582 31 15.875V9.47461C30.9998 9.07451 30.6755 8.75021 30.2754 8.75H23.875C23.3918 8.75 23 8.35825 23 7.875C23 7.39175 23.3918 7 23.875 7H30.2754Z"
          fill="#7C7C7C"
        />
        {/* scanner */}
        <rect
          x="3"
          y="-4"
          width="34"
          height="4"
          rx="1.75"
          fill="#7C7C7C"
          ref={scannerRef}
        />
      </g>
      <defs>
        <clipPath id="clip0_6698_4636">
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const scannerKeyFrames: Keyframe[] = [
  { transform: "translateY(0)" },
  { transform: "translateY(44px)" },
];
const scanDownAnimationOptions: EffectTiming = {
  duration: 1000,
  delay: 1000,
  easing: "ease-out",
};
const scanUpAnimationOptions: EffectTiming = {
  duration: 1000,
  direction: "reverse",
  delay: 500,
  easing: "ease-in",
};

const squareKeyFrames: Keyframe[] = [
  { fill: "#F1F1F1" },
  { fill: "#FFFFFF" },
  { fill: "#F1F1F1" },
];
const squareAnimationOptions: EffectTiming = {
  duration: 1000,
};
