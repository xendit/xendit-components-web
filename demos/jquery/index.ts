import "jquery";
import { initializeTestSession } from "../../sdk/dist/index.esm.js";

const cart: [string, string][] = [];

$(function () {
  function hidePages() {
    $(".store").hide();
    $(".checkout").hide();
    $(".payment-success").hide();
  }

  function updateCart() {
    $(".cart-count-container").text(cart.length);
    $(".cart-item-template").siblings().remove();
    let total = 0;
    for (const item of cart) {
      const el = $(".cart-item-template")
        .clone()
        .removeClass("cart-item-template")
        .show();
      el.find(".cart-item-name").text(`Product ${item[0]}`);
      el.find(".cart-item-quantity").text("1");
      const price = parseInt(item[1]);
      total += price;
      el.find(".cart-item-price").text(`IDR ${price.toLocaleString()}`);
      $(".cart-items").append(el);
    }
    $(".total-contianer").text(`IDR ${total.toLocaleString()}`);
  }

  $("h1").on("click", function () {
    hidePages();
    $(".store").show();
  });

  $(".add-to-cart").on("click", function () {
    const item = $(this).closest(".product").data("product") as string;
    cart.push(item.split(",") as [string, string]);
    updateCart();
  });

  $(".go-to-cart").on("click", function () {
    hidePages();
    $(".checkout").show();
  });

  $(".begin-checkout").on("click", function () {
    initializeTestSession({
      sessionClientKey: "test",
    }).then((sdk) => {
      sdk.env = "demo";

      $(".payment-container").append(sdk.createChannelPickerComponent());
      $(".submit").show();

      $(sdk).on("ready", function () {
        $(".submit").prop("disabled", false);
      });
      $(sdk).on("not-ready", function () {
        $(".submit").prop("disabled", true);
      });

      $(sdk).on("session-complete", () => {
        hidePages();
        $(".payment-success").show();
      });

      $(".submit").on("click", async () => {
        sdk.submit();
      });
    });
  });
});
