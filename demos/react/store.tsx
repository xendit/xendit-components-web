import { XenditComponents } from "xendit-components";
import data from "../data.json";
import { Payment } from "./payment";
import { Product, CartItem as CartItemType, PageType } from "./types";
import { useMemo, useRef } from "react";

const PRODUCTS: Product[] = data.products;
const EXCHANGE_RATES: { [currency: string]: number } = data.exchangeRates;

export const StorePage: React.FC<{
  selectedCurrency: string;
  onChangeCurrency: (currency: string) => void;
  cart: CartItemType[];
  onAddToCart: (productId: number) => void;
  goToPage: (page: PageType) => void;
}> = ({ selectedCurrency, onChangeCurrency, cart, onAddToCart, goToPage }) => {
  return (
    <div className="store">
      <Header
        cart={cart}
        selectedCurrency={selectedCurrency}
        onChangeCurrency={onChangeCurrency}
        goToPage={goToPage}
      />
      <div className="page">
        <div className="columns">
          <div className="left">
            <div className="store-card">
              <div className="store-logo-container">
                <img className="store-logo" src="/assets/logo-hero.svg" />
              </div>
              <h2 className="store-card-subtitle">
                XENDIT OFFICIAL PLUSHIE STORE
              </h2>
              <p className="store-card-description">
                Welcome to Plushxie! 👋🏻 <br />
                We’re bringing the cutest badgers straight from Blok M.
              </p>
              <p className="store-card-disclaimer">
                This is a demonstration of the Xendit Components SDK. No actual
                payment will be processed.
              </p>
            </div>
          </div>
          <div className="right">
            <h1 className="store-title">All Plushxies</h1>
            <div className="products">
              {PRODUCTS.map((product, i) => (
                <ProductItem
                  key={i}
                  productId={i}
                  product={product}
                  onAddToCart={onAddToCart}
                  currency={selectedCurrency}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductItem: React.FC<{
  productId: number;
  product: Product;
  onAddToCart: (productId: number) => void;
  currency: string;
}> = ({ productId, product, onAddToCart, currency }) => {
  const color = useMemo(
    () => data.colors[Math.floor(Math.random() * data.colors.length)],
    [],
  );
  return (
    <button className="product" onClick={() => onAddToCart(productId)}>
      <div className="product-image-wrapper" style={{ backgroundColor: color }}>
        <img className="product-image" src={product.image} />
      </div>
      <div className="product-details">
        <p className="product-title">{product.title}</p>
        <p className="product-description">{product.description}</p>
        <p className="product-price">
          {XenditComponents.amountFormat(
            product.price * EXCHANGE_RATES[currency],
            currency,
          )}
        </p>
      </div>
    </button>
  );
};

export const Header: React.FC<{
  cart: CartItemType[];
  selectedCurrency?: string;
  onChangeCurrency?: (currency: string) => void;
  goToPage: (page: PageType) => void;
}> = ({ cart, selectedCurrency, onChangeCurrency, goToPage }) => {
  const currencyButtonRef = useRef<HTMLDivElement>(null);

  const currencies = Object.keys(data.exchangeRates);

  return (
    <div className="header">
      <img className="header-logo" src="/assets/logo-small.svg" />
      <div className="header-controls">
        {onChangeCurrency ? (
          <>
            <button
              className="currency-picker"
              popoverTarget="currency-picker-popover"
            >
              <span className="selected-currency">{selectedCurrency}</span>
              <img src="/assets/caret.svg" />
            </button>
            <div
              id="currency-picker-popover"
              className="currency-picker-popover"
              popover="auto"
              ref={currencyButtonRef}
            >
              {currencies.map((currency, i) => (
                <button
                  key={i}
                  className="currency-option"
                  onClick={() => {
                    onChangeCurrency(currency);
                    currencyButtonRef.current?.hidePopover();
                  }}
                >
                  {currency}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <button
          className="cart-button"
          onClick={() => goToPage("checkout")}
          disabled={cart.length === 0}
        >
          Checkout
          <img className="cart-icon" src="/assets/cart.svg" />
          <span className="cart-item-count">
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </span>
        </button>
      </div>
    </div>
  );
};

export const CheckoutPage: React.FC<{
  goToPage: (page: PageType) => void;
  cart: CartItemType[];
  selectedCurrency: string;
}> = ({ goToPage, cart, selectedCurrency }) => {
  return (
    <div className="checkout">
      <div className="page">
        <div className="columns">
          <div className="left">
            <button
              className="back-to-store-button"
              onClick={() => goToPage("store")}
            >
              <img src="/assets/back.svg" />
              Back
            </button>
            <h1 className="checkout-title">Complete Your Payment</h1>
            <Payment
              onSuccess={() => goToPage("payment-success")}
              onFail={(message) => alert(`Error: ${message}`)}
              goToPage={goToPage}
            />
          </div>
          <div className="right">
            <div className="order-summary-box">
              <div className="order-summary">
                <img
                  className="order-summary-logo"
                  src="/assets/logo-small.svg"
                />
                <h2>Your Order Summary</h2>
                <p className="order-ref">test-order-00001122025</p>
              </div>
              <div className="order-line-items">
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <CartItem
                      key={index}
                      item={item}
                      currency={selectedCurrency}
                    />
                  ))}
                </div>
                <div className="total">
                  <div className="line-item">
                    <span className="line-item-name">Total</span>
                    <span className="line-item-price">
                      {XenditComponents.amountFormat(
                        cart.reduce(
                          (total, item) =>
                            total +
                            PRODUCTS[item.id].price *
                              EXCHANGE_RATES[selectedCurrency] *
                              item.quantity,
                          0,
                        ),
                        selectedCurrency,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="terms-of-service">
                <p>
                  This is a demonstration of the Xendit Components SDK. No
                  actual payment will be processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem: React.FC<{ item: CartItemType; currency: string }> = ({
  item,
  currency,
}) => {
  const product = PRODUCTS[item.id];
  const exchangeRate = EXCHANGE_RATES[currency];
  return (
    <div className="line-item">
      <span className="line-item-name">
        {item.quantity !== 1
          ? `${product.title} ✕ ${item.quantity}`
          : product.title}
      </span>
      <span className="line-item-price">
        {XenditComponents.amountFormat(
          product.price * exchangeRate * item.quantity,
          currency,
        )}
      </span>
    </div>
  );
};

export const PaymentSuccessPage: React.FC<{
  goToPage: (page: PageType) => void;
}> = ({ goToPage }) => {
  return (
    <div className="payment-success">
      <Header cart={[]} goToPage={goToPage} />
      <div className="payment-success-message store-card">
        <div className="store-logo-container">
          <img className="store-logo" src="/assets/logo-hero.svg" />
        </div>
        <h2 className="store-card-subtitle">PAYMENT SUCCESSFUL</h2>
        <h2 className="store-card-description">
          Thank you for trying out the Xendit Components SDK.
        </h2>
      </div>
    </div>
  );
};
