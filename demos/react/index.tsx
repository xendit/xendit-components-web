import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CartItem, Product } from "./types.js";
import { StorePage } from "./store.js";
import { CheckoutPage } from "./checkout.js";
import { PaymentSuccessPage } from "./success.js";

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState<
    "store" | "checkout" | "payment-success"
  >("store");
  const products: Product[] = [
    { id: "1", price: 10000, name: "Product 1" },
    { id: "2", price: 30000, name: "Product 2" },
    { id: "3", price: 100000, name: "Product 3" },
  ];

  const addToCart = (productId: string, price: number) => {
    setCart((prev) => [...prev, { id: productId, price }]);
  };

  const goToPage = (page: "store" | "checkout" | "payment-success") => {
    setCurrentPage(page);
  };

  function renderPage() {
    switch (currentPage) {
      case "store":
        return <StorePage products={products} onAddToCart={addToCart} />;
      case "checkout":
        return (
          <CheckoutPage
            cart={cart}
            onPaymentSuccess={() => goToPage("payment-success")}
          />
        );
      case "payment-success":
        return <PaymentSuccessPage />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="header">
        <h1 onClick={() => goToPage("store")}>
          Demo store for Xendit Components SDK (React)
        </h1>
        <button className="go-to-cart" onClick={() => goToPage("checkout")}>
          Cart (<span className="cart-count-container">{cart.length}</span>)
        </button>
      </div>
      {renderPage()}
    </>
  );
};

// Initialize React app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
