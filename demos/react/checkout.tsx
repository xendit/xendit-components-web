import { useEffect, useRef, useState } from "react";
import { CartItem } from "./types";
import {
  XenditSessionSdk,
  XenditSessionTestSdk,
} from "../../sdk/dist/index.esm";

export const CheckoutPage: React.FC<{
  cart: CartItem[];
  onPaymentSuccess: () => void;
}> = ({ cart, onPaymentSuccess }) => {
  const [checkingOut, setCheckingOut] = useState(false);

  const onBeginCheckout = () => {
    setCheckingOut(true);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <div className="columns">
        <div className="left">
          <div className="cart-items">
            {cart.map((item, index) => (
              <CartItemComponent key={index} item={item} index={index} />
            ))}
          </div>
          <p>
            Total:{" "}
            <span className="total-contianer">
              IDR {calculateTotal().toLocaleString()}
            </span>
          </p>
          <button className="begin-checkout" onClick={onBeginCheckout}>
            Begin Checkout
          </button>
        </div>
        <div className="right">
          {checkingOut && <Payment onSuccess={onPaymentSuccess} />}
        </div>
      </div>
    </div>
  );
};

const CartItemComponent: React.FC<{ item: CartItem; index: number }> = ({
  item,
  index,
}) => {
  return (
    <div key={index} className="cart-item">
      <span className="cart-item-name">Product {item.id}</span> -
      <span className="cart-item-quantity"> 1</span> x
      <span className="cart-item-price">
        {" "}
        IDR {item.price.toLocaleString()}
      </span>
    </div>
  );
};

const Payment: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const el = useRef<HTMLDivElement | null>(null);
  const [sdk, setSdk] = useState<XenditSessionSdk | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Using the test SDK class
    const sdk = new XenditSessionTestSdk({
      sessionClientKey: "test",
    });
    sdk.env = "demo";
    setSdk(sdk);

    // The channel picker element is returned immediately and populated after initialization
    const channelPicker = sdk.createChannelPickerComponent();
    el.current?.appendChild(channelPicker);
  }, []);

  useEffect(() => {
    if (!sdk) return;

    sdk.addEventListener("ready", () => {
      setReady(true);
    });
    sdk.addEventListener("not-ready", () => {
      setReady(false);
    });

    sdk.addEventListener("session-complete", () => {
      onSuccess();
    });
  }, [sdk, onSuccess]);

  function onSubmit() {
    sdk?.submit();
  }

  return (
    <div>
      <div ref={el}></div>
      <button className="submit" onClick={onSubmit} disabled={!ready}>
        Submit
      </button>
    </div>
  );
};
