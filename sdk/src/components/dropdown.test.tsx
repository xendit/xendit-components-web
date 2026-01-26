import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/dom";
import { render } from "preact";
import { Dropdown, DropdownOption } from "./dropdown";
import userEvent from "@testing-library/user-event";
import { SdkContext } from "./session-provider";
import { XenditComponents } from "../public-sdk";

afterEach(() => {
  render(null, document.body);
});

const mockOptions: DropdownOption[] = [
  {
    title: "A",
    value: "a",
  },
  {
    title: "B",
    value: "b",
  },
];

describe("dropdown", () => {
  it("should render a button", async () => {
    render(
      <SdkContext.Provider
        value={{ t: (str: string) => str } as XenditComponents}
      >
        <Dropdown
          options={mockOptions}
          onChange={vi.fn()}
          placeholder="Select item"
          label="Dropdown example"
        />
      </SdkContext.Provider>,
      document.body,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Select item")).toBeInTheDocument();
  });
  it("should select item", async () => {
    render(
      <SdkContext.Provider
        value={{ t: (str: string) => str } as XenditComponents}
      >
        <Dropdown
          options={mockOptions}
          onChange={vi.fn()}
          placeholder="Select item"
          label="Dropdown example"
        />
      </SdkContext.Provider>,
      document.body,
    );
    await userEvent.click(screen.getByText("Select item"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    await userEvent.click(screen.getByText("A"));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
  it("should close on clicking outside the dropdown", async () => {
    render(
      <SdkContext.Provider
        value={{ t: (str: string) => str } as XenditComponents}
      >
        <Dropdown
          options={mockOptions}
          onChange={vi.fn()}
          placeholder="Select item"
          label="Dropdown example"
        />
      </SdkContext.Provider>,
      document.body,
    );
    await userEvent.click(screen.getByText("Select item"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("should select an item using the keyboard", async () => {
    render(
      <SdkContext.Provider
        value={{ t: (str: string) => str } as XenditComponents}
      >
        <Dropdown
          options={mockOptions}
          onChange={vi.fn()}
          placeholder="Select item"
          label="Dropdown example"
        />
      </SdkContext.Provider>,
      document.body,
    );
    await userEvent.keyboard("{Tab}{Enter}{ArrowDown}{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
  it("should search and select an item", async () => {
    render(
      <SdkContext.Provider
        value={{ t: (str: string) => str } as XenditComponents}
      >
        <Dropdown
          options={mockOptions}
          onChange={vi.fn()}
          placeholder="Select item"
          label="Dropdown example"
        />
      </SdkContext.Provider>,
      document.body,
    );
    await userEvent.keyboard("{Tab}{Enter}B{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
