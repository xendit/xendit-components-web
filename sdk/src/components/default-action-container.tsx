import { useLayoutEffect, useRef } from "preact/hooks";
import { XenditSessionSdk } from "../public-sdk";
import { Dialog } from "./dialog";

type Props = {
  sdk: XenditSessionSdk;
  title: string;
  close?: boolean;
  onClose: () => void;
};

export default function DefaultActionContainer(props: Props) {
  const { sdk, title, onClose } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const component = sdk.createActionContainerComponent();
    wrapperRef.current?.replaceChildren(component);
    return () => {
      sdk.destroyComponent(component);
    };
  }, [sdk]);

  return (
    <Dialog title={title} onClose={onClose} close={props.close}>
      <div ref={wrapperRef} />
    </Dialog>
  );
}
