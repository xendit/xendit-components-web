import { TFunction } from "i18next";

type Props = {
  amount: number;
  channelLogo: string;
  currency: string;
  mock: boolean;
  onAffirm: () => void;
  vaNumber: string;
  merchantName: string;
  t: TFunction<"session">;
  title: string;
};

export function ActionVa(props: Props) {
  const {
    // amount,
    // channelLogo,
    // currency,
    // mock,
    // onAffirm,
    vaNumber,
    merchantName,
    // t,
    // title,
  } = props;

  return (
    <div>
      <div>{vaNumber}</div>
      <div>{merchantName}</div>
    </div>
  );
}
