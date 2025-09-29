import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

export type DropdownOption = {
  leadingAsset?: ComponentChildren; // e.g. flag/icon URL
  title?: string; // primary line
  description?: string; // secondary line
  disabled?: boolean;
};

export type DropdownProps = {
  /** Unique id for aria attributes */
  id: string;

  /** Options to render */
  options: DropdownOption[];

  /**
   * Called when a new option is selected.
   * Receives the selected option & its index.
   */
  onChange: (option: DropdownOption, index: number) => void;

  /** Optional initial selection index (uncontrolled). Default: -1 (none). */
  defaultIndex?: number;

  /** Optional externally-controlled selection index. If set, component becomes controlled. */
  selectedIndex?: number;

  /** Optional label for a11y (used in aria-labelledby). */
  label?: string;

  /** Placeholder text when nothing selected. */
  placeholder?: string;

  /** Extra class on the root container. */
  className?: string;
};

export const Dropdown = (props: DropdownProps) => {
  const {
    id,
    options,
    onChange,
    defaultIndex = -1,
    selectedIndex,
    className,
  } = props;

  // Controlled vs uncontrolled selection
  const isControlled = typeof selectedIndex === "number";
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const currentIndex = isControlled ? (selectedIndex as number) : internalIndex;

  // Active item for keyboard nav (when list open)
  const [activeIndex, setActiveIndex] = useState(
    currentIndex >= 0 ? currentIndex : 0,
  );
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Ids for ARIA wiring
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const listboxId = `${id}-listbox`;

  const clampedActive = Math.max(0, Math.min(options.length - 1, activeIndex));
  const activeOptionId = options[clampedActive]
    ? `${id}-opt-${clampedActive}`
    : `${id}-opt-none`;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Keep active in sync with current selection when opening
  useEffect(() => {
    if (!open) return;
    if (currentIndex >= 0) setActiveIndex(currentIndex);
  }, [open, currentIndex]);

  // Scroll to active/selected
  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = document.getElementById(activeOptionId);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, activeOptionId]);

  const commit = (index: number, disabled?: boolean) => {
    if (disabled === true) return;
    const opt = options[index];
    if (!opt) return;
    if (!isControlled) setInternalIndex(index);
    onChange(opt, index);
    setOpen(false);
    btnRef.current?.focus();
  };

  const openList = () => {
    if (!open) {
      setOpen(true);
      queueMicrotask(() => listRef.current?.focus());
    }
  };

  const closeList = () => {
    if (open) {
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === " " ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeList();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(clampedActive);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
  };

  const selected = currentIndex >= 0 ? options[currentIndex] : undefined;

  return (
    <div
      ref={rootRef}
      className={`${className ?? ""}`}
      aria-expanded={open ? "true" : "false"}
      aria-controls={listboxId}
      aria-haspopup="listbox"
      aria-labelledby={labelId}
    >
      <button
        ref={btnRef}
        type="button"
        className=""
        aria-controls={listboxId}
        aria-expanded={open ? "true" : "false"}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={(e) => onButtonKeyDown(e as unknown as KeyboardEvent)}
      >
        {selected?.leadingAsset}

        <span className="" id={valueId}>
          {selected && (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13 6L8 11L3 6"
                  stroke="#252525"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </>
          )}
        </span>
      </button>

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        tabIndex={-1}
        className="DropdownMenu"
        aria-labelledby={labelId}
        aria-activedescendant={activeOptionId}
        style={{ display: open ? "block" : "none" }}
        onKeyDown={(e) => onListKeyDown(e as unknown as KeyboardEvent)}
      >
        {options.map((opt, i) => {
          const isSelected = i === currentIndex;
          const isActive = i === clampedActive;
          return (
            <li
              key={`${id}-opt-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-disabled={opt.disabled == true}
              aria-selected={isSelected ? "true" : "false"}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i, opt.disabled == true)}
            >
              <div
                className={`xendit-dropdown-item ${isActive ? "is-active" : ""}`}
              >
                <div className={"xendit-dropdown-content country"}>
                  {opt.leadingAsset && (
                    <div className="xendit-dropdown-item-leading-asset">
                      {opt.leadingAsset}
                    </div>
                  )}
                  <div className="xendit-dropdown-item-content">
                    {opt.title && (
                      <div className="xendit-dropdown-item-title xendit-text-16">
                        {opt.title}
                      </div>
                    )}
                    {opt.description && (
                      <div className="xendit-dropdown-item-description xendit-text-12">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="xendit-dropdown-item-selected">
                    <svg>
                      <path
                        d="M13.5 4.5L6.5 11.5L3 8"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
