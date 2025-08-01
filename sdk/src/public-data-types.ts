/**
 * @public
 */
export interface XenditSession {}

/**
 * @public
 */
export interface XenditPaymentChannel {}

/**
 * @public
 */
export interface XenditPaymentChannelGroup {}

type ChannelPropertyPrimative = string | number | boolean | undefined;
export type ChannelProperty =
  | ChannelPropertyPrimative
  | ChannelPropertyPrimative[]
  | Record<string, ChannelPropertyPrimative>;
export type ChannelProperties = Record<string, ChannelProperty>;
