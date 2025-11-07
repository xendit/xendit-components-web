import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CartItem } from "./types";
import { XenditSessionSdk, XenditSessionTestSdk } from "xendit-components";

export const CheckoutPage: React.FC<{
  cart: CartItem[];
  onPaymentSuccess: () => void;
}> = ({ cart, onPaymentSuccess }) => {
  const [checkingOut, setCheckingOut] = useState(false);
  const [componentsKey, setComponentsKey] = useState("");

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
          <input
            type="text"
            id="components-sdk-key"
            placeholder="Enter Components SDK Key"
            value={componentsKey}
            onInput={(e) =>
              setComponentsKey((e.target as HTMLInputElement).value)
            }
          />
          <br />
          <button className="begin-checkout" onClick={onBeginCheckout}>
            Begin Checkout (with SDK key)
          </button>
          <button className="begin-checkout" onClick={onBeginCheckout}>
            Begin Checkout (mock)
          </button>
        </div>
        <div className="right">
          {checkingOut && (
            <Payment
              componentsKey={componentsKey}
              onSuccess={onPaymentSuccess}
            />
          )}
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

const Payment: React.FC<{ componentsKey: string; onSuccess: () => void }> = ({
  componentsKey,
  onSuccess,
}) => {
  const el = useRef<HTMLDivElement | null>(null);
  const [sdk, setSdk] = useState<XenditSessionSdk | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Using the test SDK class
    let sdk: XenditSessionSdk;
    if (componentsKey) {
      sdk = new XenditSessionSdk({
        sessionClientKey: componentsKey,
      });
    } else {
      sdk = new XenditSessionTestSdk({});
    }
    sdk.env = "demo";
    setSdk(sdk);

    // The channel picker element is returned immediately and populated after initialization
    const channelPicker = sdk.createChannelPickerComponent();
    el.current?.appendChild(channelPicker);
  }, [componentsKey]);

  useLayoutEffect(() => {
    if (!sdk) return;

    sdk.addEventListener("init", () => {
      setIsInitialized(true);
    });

    sdk.addEventListener("ready", () => {
      setReady(true);
    });
    sdk.addEventListener("not-ready", () => {
      setReady(false);
    });

    sdk.addEventListener("submission-begin", () => {
      setPending(true);
    });
    sdk.addEventListener("submission-end", () => {
      setPending(false);
    });

    sdk.addEventListener("session-complete", () => {
      onSuccess();
    });
  }, [sdk, onSuccess]);

  function onSubmit() {
    sdk?.submit();
  }

  return (
    <div style={{ opacity: pending ? 0.3 : 1 }}>
      <div ref={el}></div>
      {isInitialized ? (
        <button className="submit" onClick={onSubmit} disabled={!ready}>
          Submit
        </button>
      ) : null}
    </div>
  );
};
