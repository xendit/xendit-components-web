import { useLayoutEffect, useRef } from "preact/hooks";
import { XenditComponents } from "../public-sdk";
import { Dialog } from "./dialog";
import { internal } from "../internal";

type Props = {
  sdk: XenditComponents;
  title: string;
  close?: boolean;
  onClose: () => void;
};

export default function DefaultActionContainer(props: Props) {
  const { sdk, title, onClose } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const component = sdk.createActionContainerComponent(internal);
    wrapperRef.current?.replaceChildren(component);
    return () => {
      sdk.destroyComponent(component);
    };
  }, [sdk]);

  return (
    <Dialog title={title} onClose={onClose} close={props.close}>
      <div className="xendit-default-action-container" ref={wrapperRef} />
    </Dialog>
  );
}
