import { FunctionComponent } from "preact";
import { DigitalWalletGooglepay } from "./digital-wallet-googlepay";
import { DigitalWalletOptions } from "../public-options-types";
import { XenditDigitalWalletCode } from "../public-data-types";

type Props<T extends XenditDigitalWalletCode> = {
  digitalWalletCode: T;
  digitalWalletOptions?: DigitalWalletOptions<T>;
};

export const DigitalWalletContainer: FunctionComponent<
  Props<XenditDigitalWalletCode>
> = (props) => {
  const { digitalWalletCode, digitalWalletOptions } = props;

  switch (digitalWalletCode) {
    case "GOOGLE_PAY":
      return <DigitalWalletGooglepay buttonOptions={digitalWalletOptions} />;
    default:
      return null;
  }
};
