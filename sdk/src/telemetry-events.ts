export type TelemetryStage =
  | "CHECKOUT_LOADED"
  | "CHECKOUT_RESUME"
  | "CHECKOUT_CHANNEL_GROUP"
  | "CHECKOUT_CHANNEL"
  | "CHECKOUT_CHANNEL_FORM_INPUT"
  | "CHECKOUT_ATTEMPT_BEGIN"
  | "CHECKOUT_ATTEMPT"
  | "CHECKOUT_ATTEMPT_DISCARD"
  | "CHECKOUT_ACTION_BEGIN"
  | "CHECKOUT_ACTION_CLOSE"
  | "CHECKOUT_DIGITAL_WALLET_BEGIN"
  | "CHECKOUT_DIGITAL_WALLET_CLOSE"
  | "CHECKOUT_ACTION_COPY_TEXT"
  | "CHECKOUT_END"
  | "CHECKOUT_PENDING"
  | "CHECKOUT_ABANDON"
  | "CHECKOUT_REDIRECT_AWAY";

export interface SessionTelemetryEvent {
  stage: TelemetryStage;
  success: boolean;
  payment_channel?: string;
  payment_request_id?: string;
  payment_token_id?: string;
  metadata?: object;
}

export const TelemetryEvents = {
  /**
   * On initialization, after calling the get session endpoint
   */
  CheckoutLoaded(success: boolean) {
    return {
      stage: "CHECKOUT_LOADED",
      success,
    };
  },

  /**
   * Emitted instead of CHECKOUT_LOADED if the user was redirected back from a partner page. Not applicable for ios/android.
   */
  CheckoutResume(success: boolean) {
    return {
      stage: "CHECKOUT_RESUME",
      success,
    };
  },

  /**
   * On channel group click
   */
  CheckoutChannelGroup(success: boolean, group_name: string) {
    return {
      stage: "CHECKOUT_CHANNEL_GROUP",
      success,
      metadata: {
        group_name,
      },
    };
  },

  /**
   * On current channel change
   */
  CheckoutChannel(success: boolean, payment_channel: string) {
    return {
      stage: "CHECKOUT_CHANNEL",
      success,
      payment_channel,
    };
  },

  /**
   * Once for each field in the form, the first time it's modified (including save payment method and customer given name)
   */
  CheckoutChannelFormInput(success: boolean, field_name: string) {
    return {
      stage: "CHECKOUT_CHANNEL_FORM_INPUT",
      success,
      metadata: {
        field_name,
      },
    };
  },

  /**
   * On pr/pt request sent
   */
  CheckoutAttemptBegin(success: boolean, validation_error?: string) {
    return {
      stage: "CHECKOUT_ATTEMPT_BEGIN",
      success,
      metadata: {
        validation_error,
      },
    };
  },

  /**
   * On pr/pt response received
   */
  CheckoutAttempt(success: boolean, error_code?: string) {
    return {
      stage: "CHECKOUT_ATTEMPT",
      success,
      metadata: {
        error_code,
      },
    };
  },

  /**
   * When an attempt fails (payment failure screen), or the user aborts an attempt
   */
  CheckoutAttemptDiscard(
    success: boolean,
    failure_code: string,
    user_abort: boolean,
  ) {
    return {
      stage: "CHECKOUT_ATTEMPT_DISCARD",
      success,
      metadata: {
        failure_code,
        user_abort,
      },
    };
  },

  /**
   * On action screen shown
   */
  CheckoutActionBegin(success: boolean) {
    return {
      stage: "CHECKOUT_ACTION_BEGIN",
      success,
    };
  },

  /**
   * When an action screen closes
   */
  CheckoutActionClose(success: boolean) {
    return {
      stage: "CHECKOUT_ACTION_CLOSE",
      success,
    };
  },

  /**
   * When a user clicks a digital wallet button
   */
  CheckoutDigitalWalletBegin(success: boolean) {
    return {
      stage: "CHECKOUT_DIGITAL_WALLET_BEGIN",
      success,
    };
  },

  /**
   * When a digital wallet screen completes or is closed
   */
  CheckoutDigitalWalletClose(success: boolean) {
    return {
      stage: "CHECKOUT_DIGITAL_WALLET_CLOSE",
      success,
    };
  },

  /**
   * When VA/OTC action text copy button is pressed
   */
  CheckoutActionCopyText(success: boolean, field_name: string) {
    return {
      stage: "CHECKOUT_ACTION_COPY_TEXT",
      success,
      metadata: {
        field_name,
      },
    };
  },

  /**
   * On session complete, expiry, or cancel state
   */
  CheckoutEnd(success: boolean, status: string) {
    return {
      stage: "CHECKOUT_END",
      success,
      metadata: {
        status,
      },
    };
  },

  /**
   * On session pending (not PR/PT pending)
   */
  CheckoutPending(success: boolean) {
    return {
      stage: "CHECKOUT_PENDING",
      success,
    };
  },

  /**
   * User closed page / app
   */
  CheckoutAbandon(success: boolean) {
    return {
      stage: "CHECKOUT_ABANDON",
      success,
    };
  },

  /**
   * After redirecting to one of the session return URLs (after the countdown). Only for hosted checkout.
   */
  CheckoutRedirectAway(success: boolean, status: string, url: string) {
    return {
      stage: "CHECKOUT_REDIRECT_AWAY",
      success,
      metadata: {
        status,
        url,
      },
    };
  },
} satisfies { [k: string]: (...args: never[]) => SessionTelemetryEvent };
