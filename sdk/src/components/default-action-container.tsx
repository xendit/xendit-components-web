import { useLayoutEffect, useRef } from "preact/hooks";
import { XenditComponents } from "../public-sdk";
import { Dialog } from "./core/dialog";
import { internal } from "../internal";

type Props = {
  sdk: XenditComponents;
  title: string;
  close?: boolean;
  onClose: () => void;
  width: number;
  height: number;
  borderColor: string;
};

export default function DefaultActionContainer(props: Props) {
  const { sdk, title, onClose, width, height, borderColor } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const component = sdk.createActionContainerComponent(internal);
    wrapperRef.current?.replaceChildren(component);
    return () => {
      sdk.destroyComponent(component);
    };
  }, [sdk]);

  return (
    <Dialog
      title={title}
      onClose={onClose}
      close={props.close}
      borderColor={borderColor}
      seamless
    >
      <div
        className="xendit-default-action-container"
        ref={wrapperRef}
        style={{
          width: width
            ? `calc(min(100vw - 64px, ${width}px))`
            : "calc(100vw - 64px)",
          height: height ? `calc(min(100vh - 64px, ${height}px))` : undefined,
        }}
      />
    </Dialog>
  );
}
