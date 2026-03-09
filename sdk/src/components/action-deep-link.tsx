import { FunctionComponent } from "preact";
import { RedirectInstructions } from "./redirect-instructions";
import { TFunction } from "../localization";
import { BffChannel } from "../backend-types/channel";

type Props = {
  t: TFunction;
  channel: BffChannel;
  redirectUrl: string | null;
};

export const ActionDeepLink: FunctionComponent<Props> = (props) => {
  const t = props.t;
  const channel = props.channel;
  const channelName = channel.brand_name;

  return (
    <RedirectInstructions
      title={t("action_deeplink.title")}
      subtitle={t("action_deeplink.instructions", {
        channelName,
      })}
      logoUrl={channel.brand_logo_url}
      logoAlt={t("image_alt.channel_logo", {
        channelName,
      })}
      redirectUrl={props.redirectUrl}
      redirectButtonLabel={t("action_deeplink.button", {
        channelName,
      })}
    />
  );
};
