import "@testing-library/jest-dom";

function isJSDOM() {
  return (
    typeof window === "object" && window.navigator.userAgent.includes("jsdom")
  );
}

if (isJSDOM()) {
  window.scrollTo = () => {
    // no-op
  };

  // Docuemnt prototype
  document.constructor.prototype.elementFromPoint = function () {
    return document.body;
  };

  // HTMLElement prototype
  document.documentElement.constructor.prototype.__proto__.scrollIntoView =
    function () {
      // no-op
    };
}
