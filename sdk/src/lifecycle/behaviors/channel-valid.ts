import {
  XenditNotReadyEvent,
  XenditReadyEvent,
} from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ChannelValidBehavior implements Behavior {
  private lastChannelCode: string | null = null;

  constructor(private bb: BlackboardType) {}

  enter() {
    this.sendReadyEventIfChanged();
  }

  update() {
    this.sendReadyEventIfChanged();
  }

  sendReadyEventIfChanged() {
    const channelCode = this.bb.channel?.channel_code ?? null;
    if (channelCode && channelCode !== this.lastChannelCode) {
      this.bb.dispatchEvent(new XenditReadyEvent(channelCode));
      this.lastChannelCode = channelCode;
    }
  }

  exit() {
    this.bb.dispatchEvent(new XenditNotReadyEvent());
  }
}
