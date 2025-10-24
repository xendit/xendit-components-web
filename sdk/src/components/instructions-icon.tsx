import React, { useLayoutEffect, useRef } from "react";

const supportsAnimation = HTMLElement.prototype.animate !== undefined;

export const InstructionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => {
  const arrowRef = useRef<SVGGElement>(null);
  const arrowSquareGroupRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    if (!supportsAnimation) {
      return;
    }
    arrowRef.current?.animate(arrowKeyFrames, arrowAnimationOptions);

    arrowSquareGroupRef.current?.animate(
      arrowSquareBounceKeyFrames,
      arrowSquareBounceAnimationOptions,
    );
  }, []);

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g opacity="0.5">
        <path
          d="M8.79453 10.2303C7.1791 10.2303 5.86953 11.5399 5.86953 13.1553V28.9503C5.86953 31.535 7.96484 33.6303 10.5495 33.6303H26.3445C27.96 33.6303 29.2695 32.3208 29.2695 30.7053"
          fill="#F1F1F1"
        />
        <path
          d="M8.79453 10.2303V10.2303C7.1791 10.2303 5.86953 11.5399 5.86953 13.1553V28.9503C5.86953 31.535 7.96484 33.6303 10.5495 33.6303H26.3445C27.96 33.6303 29.2695 32.3208 29.2695 30.7053V30.7053"
          stroke="#D0D0D0"
          strokeWidth="1.755"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g ref={arrowSquareGroupRef} style={{ transformOrigin: "20px 20px" }}>
        <path
          d="M28.8177 6.00256H14.7777C12.193 6.00256 10.0977 8.09787 10.0977 10.6826V24.7226C10.0977 27.3073 12.193 29.4026 14.7777 29.4026H28.8177C31.4023 29.4026 33.4977 27.3073 33.4977 24.7226V10.6826C33.4977 8.09787 31.4024 6.00256 28.8177 6.00256Z"
          fill="white"
          stroke="#EDEDED"
          strokeWidth="1.755"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g style={{ transformOrigin: "10px 30px" }} ref={arrowRef}>
          <path
            d="M26.7697 20.5301V12.7301H18.9697"
            stroke="#7C7C7C"
            strokeWidth="1.872"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.4102 22.0901L26.7702 12.7301"
            stroke="#7C7C7C"
            strokeWidth="1.872"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
};

const arrowKeyFrames: Keyframe[] = [
  { transform: "scale(0.1)" },
  { transform: "scale(1)" },
];
const arrowAnimationOptions: EffectTiming = {
  duration: 500,
  easing: "ease-out",
};

const arrowSquareBounceKeyFrames: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(5deg)" },
  { transform: "rotate(-5deg)" },
  { transform: "rotate(0deg)" },
];
const arrowSquareBounceAnimationOptions: EffectTiming = {
  duration: 1000,
  easing: "ease-out",
  iterations: Infinity,
  delay: 2000,
};
