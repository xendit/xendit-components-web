import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/dom";
import { render } from "preact";
import { DigitalWalletWaitForLoad } from "./digital-wallet-wait-for-load";
import { sleep } from "../utils";

afterEach(() => {
  render(null, document.body);
  document.querySelectorAll("script").forEach((script) => script.remove());
});

describe("DigitalWalletWaitForLoad", () => {
  it("should render children if the check passes", async () => {
    render(
      <DigitalWalletWaitForLoad
        scriptTagRegex={/a\.js/}
        checkLoaded={() => true}
      >
        Pass
      </DigitalWalletWaitForLoad>,
      document.body,
    );
    expect(screen.getByText("Pass")).toBeInTheDocument();
  });

  it("should wait until the target script tag loads", async () => {
    function checkLoadedFn(scriptTag: HTMLScriptElement | null) {
      if (!scriptTag) return () => false;
      let result = false;
      scriptTag.addEventListener("load", () => {
        result = true;
      });
      return () => {
        return result;
      };
    }

    const scriptTag = document.createElement("script");
    scriptTag.src = "https://example.com/a.js";
    document.body.appendChild(scriptTag);

    render(
      <DigitalWalletWaitForLoad
        scriptTagRegex={/a\.js$/}
        checkLoaded={checkLoadedFn(scriptTag)}
      >
        Pass
      </DigitalWalletWaitForLoad>,
      document.body,
    );

    // should not be ready
    expect(screen.queryByText("Pass")).not.toBeInTheDocument();

    // should be ready after the event
    scriptTag.dispatchEvent(new Event("load"));
    await sleep(1); // <- the load event triggers a preact state update which runs on the next tick
    expect(screen.getByText("Pass")).toBeInTheDocument();
  });

  it("should call checkLoaded at regular intervals", async () => {
    let counter = 0;
    function checkLoaded() {
      counter++;
      return counter >= 5;
    }

    render(
      <DigitalWalletWaitForLoad
        scriptTagRegex={/a\.js$/}
        checkLoaded={checkLoaded}
      >
        Pass
      </DigitalWalletWaitForLoad>,
      document.body,
    );

    // should not be ready
    expect(screen.queryByText("Pass")).not.toBeInTheDocument();

    // should be ready after a while
    expect(await screen.findByText("Pass")).toBeInTheDocument();
  });
});
