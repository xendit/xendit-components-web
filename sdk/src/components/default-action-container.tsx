import { useLayoutEffect, useRef } from "preact/hooks";
import { XenditSessionSdk } from "../public-sdk";
import { Dialog } from "./dialog";

type Props = {
  sdk: XenditSessionSdk;
  title: string;
  onCloseClick: () => void;
};

export default function DefaultActionContainer(props: Props) {
  const { sdk, title, onCloseClick } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const component = sdk.createActionContainerComponent();
    wrapperRef.current?.replaceChildren(component);
    return () => {
      sdk.destroyComponent(component);
    };
  }, [sdk]);

  return (
    <Dialog title={title} onClose={onCloseClick}>
      <div ref={wrapperRef} />
    </Dialog>
  );
}
