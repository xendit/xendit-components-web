import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

// just clears submission state on exit
export class SubmissionWrapperBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {}

  exit() {
    this.bb.submissionRequested = false;
    this.bb.simulatePaymentRequested = false;
    this.bb.useFakeSubmissionFlow = false;
    this.bb.digitalWalletProbeAvailable = true;
    this.bb.actionCompleted = false;
    this.bb.redirectReturnPending = false;
    this.bb.pollImmediatelyRequested = false;
    this.bb.hackyOvoActionLatch = false;
    this.bb.prefersRedirectAction = false;
    // this.bb.sessionUpdateSummary = undefined;
  }
}
