import { FunctionComponent } from "preact";
import { DigitalWalletCode } from "../public-sdk";
import { DigitalWalletGooglepay } from "./digital-wallet-googlepay";

type Props = {
  digitalWalletCode: DigitalWalletCode;
};

export const DigitalWalletContainer: FunctionComponent<Props> = (props) => {
  const { digitalWalletCode } = props;

  switch (digitalWalletCode) {
    case "GOOGLE_PAY":
      return <DigitalWalletGooglepay />;
    default:
      return null;
  }
};
