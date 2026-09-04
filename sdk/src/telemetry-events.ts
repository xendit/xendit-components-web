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
  | "CHECKOUT_DIGITAL_WALLET_LOADED"
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
  metadata?: Record<string, string | number | boolean | undefined>;
}

export const TelemetryEvents = {
  /**
   * On initialization, after calling the get session endpoint
   */
  Loaded(success: boolean) {
    return {
      stage: "CHECKOUT_LOADED",
      success,
    };
  },

  /**
   * Emitted instead of CHECKOUT_LOADED if the user was redirected back from a partner page. Not applicable for ios/android.
   */
  Resume(success: boolean) {
    return {
      stage: "CHECKOUT_RESUME",
      success,
    };
  },

  /**
   * On channel group click
   */
  ChannelGroup(success: boolean, group_name: string) {
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
  Channel(success: boolean, payment_channel: string) {
    return {
      stage: "CHECKOUT_CHANNEL",
      success,
      payment_channel,
    };
  },

  /**
   * Once for each field in the form, the first time it's modified (including save payment method and customer given name)
   */
  ChannelFormInput(success: boolean, field_name: string) {
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
  AttemptBegin(success: boolean, validation_error?: string) {
    return {
      stage: "CHECKOUT_ATTEMPT_BEGIN",
      success,
      metadata: {
        validation_error,
      },
    };
  },

  /**
   * On pr response received
   */
  Attempt_PR(success: boolean, payment_request_id: string) {
    return {
      stage: "CHECKOUT_ATTEMPT",
      success,
      payment_request_id,
    };
  },

  /**
   * On pt response received
   */
  Attempt_PT(success: boolean, payment_token_id: string) {
    return {
      stage: "CHECKOUT_ATTEMPT",
      success,
      payment_token_id,
    };
  },

  /**
   * On pr/pt fail
   */
  Attempt_Error(success: boolean, error_code?: string) {
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
  AttemptDiscard(success: boolean, failure_code?: string) {
    return {
      stage: "CHECKOUT_ATTEMPT_DISCARD",
      success,
      metadata: {
        failure_code,
      },
    };
  },

  /**
   * On action screen shown
   */
  ActionBegin(success: boolean) {
    return {
      stage: "CHECKOUT_ACTION_BEGIN",
      success,
    };
  },

  /**
   * When an action screen closes
   */
  ActionClose(success: boolean) {
    return {
      stage: "CHECKOUT_ACTION_CLOSE",
      success,
    };
  },

  /**
   * When a digital wallet component has loaded and is ready
   */
  DigitalWalletLoaded(success: boolean, digital_wallet: string) {
    return {
      stage: "CHECKOUT_DIGITAL_WALLET_LOADED",
      success,
      metadata: { digital_wallet },
    };
  },

  /**
   * When a user clicks a digital wallet button
   */
  DigitalWalletBegin(success: boolean, digital_wallet: string) {
    return {
      stage: "CHECKOUT_DIGITAL_WALLET_BEGIN",
      success,
      metadata: { digital_wallet },
    };
  },

  /**
   * When a digital wallet screen completes or is closed
   */
  DigitalWalletClose(success: boolean, error_code?: string) {
    return {
      stage: "CHECKOUT_DIGITAL_WALLET_CLOSE",
      success,
      metadata: { error_code },
    };
  },

  /**
   * When VA/OTC action text copy button is pressed
   */
  ActionCopyText(success: boolean, field_name: string) {
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
  End(success: boolean, status: string) {
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
  Pending(success: boolean) {
    return {
      stage: "CHECKOUT_PENDING",
      success,
    };
  },

  /**
   * User closed page / app
   */
  Abandon(success: boolean) {
    return {
      stage: "CHECKOUT_ABANDON",
      success,
    };
  },

  /**
   * After redirecting to one of the session return URLs (after the countdown). Only for hosted checkout.
   */
  RedirectAway(success: boolean, status: string) {
    return {
      stage: "CHECKOUT_REDIRECT_AWAY",
      success,
      metadata: {
        status,
      },
    };
  },
} satisfies { [k: string]: (...args: never[]) => SessionTelemetryEvent };
