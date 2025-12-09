import $ from "jquery";
import data from "../data.json";
import { XenditSessionSdk } from "xendit-components";

let selectedCurrency = "USD";
const cart: {
  id: number;
  quantity: number;
}[] = [];

export function hidePages() {
  $(".store").hide();
  $(".checkout").hide();
  $(".payment-success").hide();
}

export function goToPage(selector: string) {
  hidePages();
  $(selector).show();
}

export function updateProducts() {
  $(".product-template").siblings().remove();
  for (let i = 0; i < data.products.length; i++) {
    const product = data.products[i];
    const el = $(".product-template")
      .clone()
      .removeClass("product-template")
      .show();
    el.data("product", i);
    el.find(".product-title").text(product.title);
    el.find(".product-description").text(product.description);
    const localPrice =
      product.price *
      data.exchangeRates[selectedCurrency as keyof typeof data.exchangeRates];
    el.find(".product-price").text(
      XenditSessionSdk.moneyFormat(localPrice, selectedCurrency),
    );
    el.find(".product-image-wrapper").css(
      "background-color",
      data.colors[Math.floor(Math.random() * data.colors.length)],
    );
    el.find(".product-image").attr("src", product.image);
    $(".products").append(el);

    el.on("click", function () {
      const id = Number($(this).closest(".product").data("product"));
      const image = $(this).closest(".product").find(".product-image");
      addToCart(id, image);
    });
  }
}

export function updateCartItems() {
  $(".cart-item-template").siblings().remove();
  let total = 0;
  for (const item of cart) {
    const el = $(".cart-item-template")
      .clone()
      .removeClass("cart-item-template")
      .show();
    const product = data.products[item.id];
    if (item.quantity > 1) {
      el.find(".line-item-name").text(`${product.title} (x${item.quantity})`);
    } else {
      el.find(".line-item-name").text(product.title);
    }
    const exchangeRate =
      data.exchangeRates[selectedCurrency as keyof typeof data.exchangeRates];
    const subtotal = product.price * item.quantity * exchangeRate;
    total += subtotal;
    el.find(".line-item-price").text(
      XenditSessionSdk.moneyFormat(subtotal, selectedCurrency),
    );
    $(".cart-items").append(el);
  }
  $(".total .line-item-name").text(`Total`);
  $(".total .line-item-price").text(
    XenditSessionSdk.moneyFormat(total, selectedCurrency),
  );
}

export function updateCartButton() {
  $(".cart-item-count").text(cart.reduce((acc, cur) => acc + cur.quantity, 0));
  $(".cart-button").prop("disabled", cart.length === 0);
}

export function addToCartAnimation(image: JQuery<HTMLElement>) {
  const ghost = image.clone();
  ghost.css({
    position: "absolute",
    top: image.offset()!.top,
    left: image.offset()!.left,
    width: image.width()!,
    height: image.height()!,
    pointerEvents: "none",
    opacity: 0.75,
    zIndex: 1000,
  });
  $("body").append(ghost);
  ghost.animate(
    {
      top:
        $(".cart-button").offset()!.top + $(".cart-button").outerHeight()! / 2,
      left:
        $(".cart-button").offset()!.left + $(".cart-button").outerWidth()! / 2,
      width: 0,
      height: 0,
      opacity: 0,
    },
    {
      duration: 800,
      easing: "swing",
      done: function () {
        ghost.remove();
        $(".cart-button")[0].animate(
          [
            {
              transform: "scale(1)",
            },
            {
              transform: "scale(1.5)",
            },
            {
              transform: "scale(1)",
            },
          ],
          {
            duration: 300,
          },
        );
      },
    },
  );
}

export function addToCart(id: number, image: JQuery<HTMLElement>) {
  const entry = cart.find((c) => c.id === id);
  if (entry) {
    entry.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }
  updateCartButton();
  updateCartItems();
  addToCartAnimation(image);
}

export function clearCart() {
  cart.length = 0;
  updateCartButton();
  updateCartItems();
}

export function setCurrency(currency: string) {
  if (data.exchangeRates[currency as keyof typeof data.exchangeRates]) {
    selectedCurrency = currency;
    $(".selected-currency").text(currency);
    updateProducts();
    updateCartItems();
  }
}
