import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionPaylinkBehavior implements Behavior {
  private el: HTMLLinkElement | null = null;

  constructor(
    public bb: BlackboardType,
    private actionIndex: string,
  ) {}

  enter() {
    assert(this.bb.world);
    assert(this.bb.world.paymentEntity);

    const action =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];
    if (!action) {
      throw new Error("Action not found for paylink behavior");
    }

    assertEquals(action.type, "REDIRECT_CUSTOMER");
    assertEquals(action.descriptor, "WEB_GOOGLE_PAYLINK");

    const link = document.createElement("link");
    this.el = link;

    link.rel = "facilitated-payment";
    link.href = action.value;
    document.head.appendChild(link);
  }

  exit() {
    this.el?.remove();
    this.el = null;
  }
}
