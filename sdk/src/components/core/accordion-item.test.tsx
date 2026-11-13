import { afterEach, describe, expect, it } from "vitest";
import { render } from "preact";
import { GroupLogos } from "./accordion-item";

afterEach(() => {
  render(null, document.body);
});

function makeLogos(count: number, enabledIndexes: number[]) {
  return Array.from({ length: count }, (_, index) => ({
    src: `https://example.test/logo-${index}.svg`,
    alt: `BRAND_${index}`,
    enabled: enabledIndexes.includes(index),
  }));
}

function renderedImages() {
  return Array.from(
    document.querySelectorAll<HTMLImageElement>(
      ".xendit-accordion-item-logos img.xendit-accordion-item-logo-image",
    ),
  );
}

function renderedText() {
  const container = document.querySelector(".xendit-accordion-item-logos");
  return container?.textContent ?? "";
}

describe("GroupLogos +N truncation", () => {
  it("replaces the +N text with the single enabled brand's image when it falls in the truncated portion", () => {
    // 6 logos, only the brand at index 4 (inside the +N portion) is enabled.
    render(<GroupLogos logos={makeLogos(6, [4])} />, document.body);

    const images = renderedImages();
    const srcs = images.map((img) => img.getAttribute("src"));
    // the enabled brand's image is shown in place of the +N text
    expect(srcs).toContain("https://example.test/logo-4.svg");
    // and the +N text is gone
    expect(renderedText()).not.toContain("+");
    // the enabled brand's image is not dimmed
    const enabledImg = images.find(
      (img) => img.getAttribute("src") === "https://example.test/logo-4.svg",
    );
    expect(enabledImg?.className).not.toContain(
      "xendit-accordion-item-logo-image-disabled",
    );
  });

  it("keeps the normal +N text when the single enabled brand is within the first 3", () => {
    // 6 logos, only index 1 enabled (already shown as an image, no override).
    render(<GroupLogos logos={makeLogos(6, [1])} />, document.body);

    // first 3 images + the +N text node
    expect(renderedImages()).toHaveLength(3);
    expect(renderedText()).toContain("+3");
    // the index-4 brand is swallowed into the count, not shown
    const srcs = renderedImages().map((img) => img.getAttribute("src"));
    expect(srcs).not.toContain("https://example.test/logo-4.svg");
  });

  it("keeps the normal +N text when more than one brand is enabled", () => {
    render(
      <GroupLogos logos={makeLogos(6, [0, 1, 2, 3, 4, 5])} />,
      document.body,
    );

    expect(renderedImages()).toHaveLength(3);
    expect(renderedText()).toContain("+3");
  });

  it("does not truncate or override when logos are within the max count", () => {
    render(<GroupLogos logos={makeLogos(4, [3])} />, document.body);

    expect(renderedImages()).toHaveLength(4);
    expect(renderedText()).not.toContain("+");
  });
});
