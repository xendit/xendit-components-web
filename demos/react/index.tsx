import React, { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { CartItem, PageType } from "./types.js";
import { CheckoutPage, PaymentSuccessPage, StorePage } from "./store.js";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>("store");

  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((productId: number) => {
    setCart((prev) => {
      const clone = [...prev];
      const existingItemIndex = clone.findIndex(
        (item) => item.id === productId,
      );
      if (existingItemIndex >= 0) {
        clone[existingItemIndex].quantity += 1;
      } else {
        clone.push({ id: productId, quantity: 1 });
      }
      return clone;
    });
  }, []);

  const goToPage = useCallback((page: PageType) => {
    setCurrentPage(page);
  }, []);

  switch (currentPage) {
    case "store":
      return (
        <StorePage
          selectedCurrency={selectedCurrency}
          onChangeCurrency={setSelectedCurrency}
          cart={cart}
          onAddToCart={addToCart}
          goToPage={goToPage}
        />
      );
    case "checkout":
      return (
        <CheckoutPage
          cart={cart}
          goToPage={goToPage}
          selectedCurrency={selectedCurrency}
        />
      );
    case "payment-success":
      return <PaymentSuccessPage goToPage={goToPage} />;
    default:
      return null;
  }
};

// Initialize React app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
