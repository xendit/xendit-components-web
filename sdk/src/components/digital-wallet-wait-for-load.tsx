import { ComponentChildren, FunctionComponent } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";

/**
 * Renders the children only if the condition passes. Re-checks the condition when the given scripe tag is loaded, or every second.
 */
export const DigitalWalletWaitForLoad: FunctionComponent<{
  scriptTagRegex: RegExp;
  checkLoaded: () => boolean;
  children: ComponentChildren;
}> = (props) => {
  const { scriptTagRegex, checkLoaded, children } = props;

  const [, forceRender] = useState<object>({});
  const ok = checkLoaded();

  useLayoutEffect(() => {
    if (ok) return;

    const targetScript = Array.from(document.scripts).find((script) =>
      scriptTagRegex.test(script.src),
    );

    targetScript?.addEventListener("load", () => {
      forceRender({});
    });
  }, [forceRender, ok, scriptTagRegex]);

  useLayoutEffect(() => {
    if (!ok) {
      const timeout = setTimeout(() => {
        forceRender({});
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [ok]);

  return ok ? children : null;
};
