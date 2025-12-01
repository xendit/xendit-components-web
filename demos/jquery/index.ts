import $ from "jquery";
import {
  goToPage,
  setCurrency,
  updateCartButton,
  updateProducts,
} from "./store";
import { beginCheckout, submitCheckout } from "./payment";

$(function () {
  goToPage(".store");
  updateProducts();
  updateCartButton();

  $(".header-logo, .back-to-store-button").on("click", function () {
    goToPage(".store");
  });

  $(".currency-option").on("click", function () {
    const currency = this.getAttribute("data-currency");
    if (currency) setCurrency(currency);
    $(".currency-picker-popover")[0].hidePopover();
  });

  $(".cart-button").on("click", function () {
    goToPage(".checkout");
    beginCheckout();
  });

  $(".submit").on("click", async () => {
    submitCheckout();
  });
});
