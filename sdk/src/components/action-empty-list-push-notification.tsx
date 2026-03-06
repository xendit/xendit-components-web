import { FunctionComponent } from "preact";
import { RedirectInstructions } from "./redirect-instructions";
import { TFunction } from "../localization";
import { BffChannel } from "../backend-types/channel";

type Props = {
  t: TFunction;
  channel: BffChannel;
};

export const ActionEmptyListPushNotification: FunctionComponent<Props> = (
  props,
) => {
  const t = props.t;
  const channel = props.channel;
  const channelName = channel.brand_name;

  return (
    <RedirectInstructions
      title={t("action_empty_list_push_notification.title")}
      subtitle={t("action_empty_list_push_notification.subtext", {
        channelName,
      })}
      logoUrl={channel.brand_logo_url}
      logoAlt={t("image_alt.channel_logo", {
        channelName,
      })}
      redirectUrl={null}
      redirectButtonLabel={null}
    />
  );
};
