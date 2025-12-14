# Events

## `init`

Notifies you when the session information is loaded. Most SDK functions require the session to be loaded and can only be called after this event.

`createChannelPickerComponent` is available before the init event.

## `session-complete` and `session-expired-or-canceled`

Notifies you when the session is in a terminal state.

`session-complete` means the session was successful, `session-expired-or-canceled` means the session was cancelled or expired.

## `submission-ready` and `submission-not-ready`

Notifies you when the user is ready to submit the payment, meaning a channel is selected and all required information is collected.

`submit` will only work in the ready state, or it will throw. Calling it when there are form validation errors will also reveal those errors
to the user.

You might want to disable your submit button when not in the ready state.

## `submission-begin` and `submission-end`

Notifies you when a submission is in progress.

You might want to show a pending state UI when in the submission state.

## `action-begin` and `action-end`

Notifies you when an action is in progress.

You might want to create an action container in the action-begin event.
