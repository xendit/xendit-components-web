import {
  ComponentChildren,
  FunctionComponent,
  TargetedEvent,
  TargetedMouseEvent,
} from "preact";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import Icon from "../icon";
import { useIdSafe } from "../../utils";
import { useSdk } from "../session-provider";
import { ButtonLoadingSpinner } from "./button";

export type DropdownOption = {
  leadingAsset?: ComponentChildren; // e.g. flag/icon URL
  leadingAssetInOverlay?: ComponentChildren; // e.g. flag/icon URL, shown in the dropdown list (instead of the main button)
  title: string; // primary line
  shortTitle?: string;
  description?: string; // secondary line
  disabled?: boolean;
  value: string;
};

export type DropdownProps = {
  /** Unique id for aria attributes */
  id?: string;

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

  /** Makes the dropdown disabled */
  disabled?: boolean;

  /** Adds a className to the button element */
  className?: string;

  /** If set, controls the overlay width */
  fixedOverlayWidth?: number;

  /** Toggles the search feature */
  enableSearch?: boolean;
};

export const Dropdown = (props: DropdownProps) => {
  const {
    id: _id,
    options,
    onChange,
    defaultIndex = -1,
    selectedIndex,
    placeholder,
    disabled,
    className,
    fixedOverlayWidth,
    enableSearch,
  } = props;

  const t = useSdk().t;

  const generatedId = useIdSafe();
  const id = _id || generatedId;

  // Controlled vs uncontrolled selection
  const isControlled = typeof selectedIndex === "number";
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const currentIndex = isControlled ? (selectedIndex as number) : internalIndex;

  // Active item for keyboard nav (when list open)
  const [activeIndex, setActiveIndex] = useState(
    currentIndex >= 0 ? currentIndex : 0,
  );
  const [_open, setOpen] = useState(false);
  const open = _open && !disabled && options.length > 0; // force closed when disabled or no options

  const [searchQuery, setSearchQuery] = useState("");
  const [lastWidth, setLastWidth] = useState(0);

  const btnRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const filtered = options.map(withIndex).filter(({ item: opt }) => {
      if (searchQuery.trim() === "") return true;
      const query = searchQuery.toLowerCase();
      return (
        opt.title.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
      );
    });

    // Show all options if no results found
    return filtered.length > 0 ? filtered : options.map(withIndex);
  }, [searchQuery, options]);

  const clampedActive = Math.max(
    0,
    Math.min(filteredOptions.length - 1, activeIndex),
  );

  // Keep the overlay width in sync with the parent of the container element
  useLayoutEffect(() => {
    if (fixedOverlayWidth) {
      setLastWidth(fixedOverlayWidth);
      return;
    }

    const targetElement = btnRef.current;
    if (!targetElement) return;
    const width = targetElement.getBoundingClientRect().width;
    setLastWidth(width);

    if (!window.ResizeObserver) {
      // jsdom doesn't support ResizeObserver
      return;
    }

    // observe for future width changes (e.g. due to window resize)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== targetElement) continue;
        if (!entry.borderBoxSize?.length) continue;
        setLastWidth(entry.borderBoxSize[0].inlineSize);
      }
    });
    resizeObserver.observe(targetElement);
    return () => resizeObserver.disconnect();
  }, [fixedOverlayWidth]);

  // if the viewport OR the overlay element changes size, and on scroll, check if the overlay is overlapping the bottom of the viewport, and if it is, add bottom:0
  useLayoutEffect(() => {
    if (!open) return;
    const overlayEl = overlayRef.current;
    if (!overlayEl) return;
    const buttonEl = btnRef.current;
    if (!buttonEl) return;

    if (!window.ResizeObserver) {
      // jsdom doesn't support ResizeObserver
      return;
    }

    function updateOverlayPosition() {
      if (!overlayEl) return;
      if (!buttonEl) return;
      // if the distance from the bottom of the button to the bottom of the viewport is less than the height of the overlay, position the overlay with bottom:0
      const buttonRect = buttonEl.getBoundingClientRect();
      const overlayRect = overlayEl.getBoundingClientRect();
      const viewportBottom = window.innerHeight;
      const spaceBelow = viewportBottom - buttonRect.bottom;
      if (spaceBelow < overlayRect.height) {
        overlayEl.style.position = "fixed";
        overlayEl.style.bottom = "0";
      } else {
        overlayEl.style.position = "";
        overlayEl.style.bottom = "";
      }
    }

    updateOverlayPosition();

    const resizeObserver = new ResizeObserver(updateOverlayPosition);
    resizeObserver.observe(overlayEl);
    window.addEventListener("resize", updateOverlayPosition);
    window.addEventListener("scroll", updateOverlayPosition, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverlayPosition);
      window.removeEventListener("scroll", updateOverlayPosition, true);
    };
  }, [open]);

  // Close on outside click
  useLayoutEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Close on outside focusout
  useLayoutEffect(() => {
    if (!open) return;
    const onFocusOut = (e: FocusEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!e.relatedTarget) return;
      if (!root.contains(e.relatedTarget as Node)) setOpen(false);
    };
    document.body.addEventListener("focusout", onFocusOut);
    return () => document.body.removeEventListener("focusout", onFocusOut);
  }, [open]);

  // Keep active in sync with current selection when opening
  useLayoutEffect(() => {
    if (!open) return;
    if (currentIndex >= 0) setActiveIndex(currentIndex);
  }, [open, currentIndex]);

  // when open state or active index changes, scroll to active item
  useLayoutEffect(() => {
    if (!open) return;
    if (!activeRef.current) return;
    if (!listRef.current) return;
    const scrollContainer = listRef.current.parentElement;
    if (!scrollContainer) return;
    scrollContainer.scrollTop =
      activeRef.current.offsetTop -
      scrollContainer.clientHeight / 2 +
      activeRef.current.clientHeight / 2;
  }, [open, activeIndex]);

  const openList = useCallback(() => {
    if (!open) {
      setOpen(true);
      queueMicrotask(() => searchInputRef.current?.focus());
    }
  }, [open]);

  const closeList = useCallback(() => {
    if (open) {
      setOpen(false);
      setSearchQuery("");
      btnRef.current?.focus();
    }
  }, [open]);

  const onButtonClick = useCallback(() => {
    if (open) {
      closeList();
    } else {
      openList();
    }
  }, [closeList, open, openList]);

  const selectItemAndClose = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt) return;
      if (opt.disabled) return;
      if (!isControlled) setInternalIndex(index);
      onChange(opt, index);
      closeList();
    },
    [closeList, isControlled, onChange, options],
  );

  const onListKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Allow normal typing in search input
      const isSearchInput = e.target === searchInputRef.current;

      if (e.key === "Escape") {
        e.preventDefault();
        closeList();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        // Allow space in search input for typing
        if (isSearchInput && e.key === " ") {
          return;
        }
        e.preventDefault();
        const activeItem = filteredOptions[clampedActive];
        if (activeItem) {
          selectItemAndClose(activeItem.originalIndex);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filteredOptions.length - 1, i + 1));
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
        setActiveIndex(filteredOptions.length - 1);
        return;
      }
    },
    [clampedActive, closeList, selectItemAndClose, filteredOptions],
  );

  const onButtonKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (open) {
        return onListKeyDown(e);
      }
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        openList();
      }
    },
    [onListKeyDown, open, openList],
  );

  const onOptionClick = useCallback(
    (e: TargetedMouseEvent<HTMLLIElement>) => {
      e.stopPropagation();
      e.preventDefault();
      selectItemAndClose(Number(e.currentTarget.dataset.index));
    },
    [selectItemAndClose],
  );

  const onSearchTermChange = useCallback(
    (e: TargetedEvent<HTMLInputElement>) => {
      setSearchQuery(e.currentTarget.value);
      setActiveIndex(0);
    },
    [],
  );

  const selected = currentIndex >= 0 ? options[currentIndex] : undefined;

  return (
    <div
      className="xendit-dropdown-container"
      ref={rootRef}
      style={{ "--xendit-dropdown-width": lastWidth + "px" }}
    >
      <button
        id={id}
        ref={btnRef}
        type="button"
        className={`xendit-dropdown ${className} ${open ? "xendit-dropdown-open" : ""} ${hasLeadingAsset(selected) ? "xendit-dropdown-has-asset" : ""}`}
        aria-expanded={open ? "true" : "false"}
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
        disabled={disabled}
      >
        {selected?.leadingAsset ?? null}

        {selected ? (
          <span className="xendit-dropdown-text xendit-text-14">
            {selected.shortTitle ?? selected.title}
          </span>
        ) : (
          <span className="xendit-dropdown-text xendit-text-14">
            {placeholder}
          </span>
        )}

        <Icon
          className="xendit-dropdown-chevron"
          name="chevron"
          size={16}
          direction="down"
        />
      </button>

      {open ? (
        <div
          className="xendit-dropdown-overlay"
          style={{ width: "var(--xendit-dropdown-width)" }}
          ref={overlayRef}
        >
          {enableSearch ? (
            <div className="xendit-dropdown-search">
              <input
                ref={searchInputRef}
                placeholder={t("combobox.default_search_placeholder")}
                value={searchQuery}
                onInput={onSearchTermChange}
                onClick={stopPropagation}
                onKeyDown={onListKeyDown}
              />
            </div>
          ) : null}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            onKeyDown={onListKeyDown}
          >
            {filteredOptions.map(({ item: opt, originalIndex }, i) => {
              const isSelected = originalIndex === currentIndex;
              const isActive = i === clampedActive;
              return (
                <li
                  key={originalIndex}
                  role="option"
                  data-index={originalIndex}
                  aria-disabled={opt.disabled ? true : undefined}
                  aria-selected={isSelected}
                  onClick={onOptionClick}
                  ref={isActive ? activeRef : undefined}
                >
                  <div
                    className={`xendit-dropdown-item xendit-text-14 ${isActive ? "xendit-dropdown-item-active" : ""} ${opt.leadingAsset ? "xendit-dropdown-has-asset" : ""} ${opt.disabled ? "xendit-dropdown-item-disabled" : ""}`}
                  >
                    {opt.leadingAssetInOverlay ?? opt.leadingAsset ?? null}
                    <div className="xendit-dropdown-item-text xendit-text-14">
                      <span className="xendit-dropdown-item-title">
                        {opt.title}
                      </span>
                      {opt.description && (
                        <span className="xendit-dropdown-item-description xendit-text-12">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <Icon
                        name="check"
                        size={16}
                        className={"xendit-dropdown-item-selected"}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export const DropdownSkeleton: FunctionComponent<{
  id: string;
  className?: string;
}> = (props) => {
  return (
    <div className="xendit-dropdown-container xendit-skeleton-field">
      <button
        className={`xendit-dropdown ${props.className}`}
        inert
        id={props.id}
        disabled
        type="button"
      >
        <ButtonLoadingSpinner />
      </button>
    </div>
  );
};

function hasLeadingAsset(option: DropdownOption | undefined) {
  if (!option) return false;
  return !!(option.leadingAssetInOverlay || option.leadingAsset);
}

function stopPropagation(e: Event) {
  e.stopPropagation();
}

function withIndex<T>(
  item: T,
  originalIndex: number,
): { item: T; originalIndex: number } {
  return {
    item,
    originalIndex,
  };
}
