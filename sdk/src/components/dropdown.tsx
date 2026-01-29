import { ComponentChildren, TargetedEvent, TargetedMouseEvent } from "preact";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import Icon from "./icon";
import { useIdSafe } from "../utils";
import { useSdk } from "./session-provider";

export type DropdownOption = {
  leadingAsset?: ComponentChildren; // e.g. flag/icon URL
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

  /** Extra class on the root container. */
  className?: string;
};

export const Dropdown = (props: DropdownProps) => {
  const {
    id: _id,
    options,
    onChange,
    defaultIndex = -1,
    selectedIndex,
    className,
    placeholder,
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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Close on outside click
  useLayoutEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setOpen(false);
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

  const onButtonKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
    [openList],
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
    <div ref={rootRef} className={`xendit-dropdown ${className ?? ""}`}>
      <button
        id={id}
        ref={btnRef}
        type="button"
        className={selected?.leadingAsset ? "xendit-dropdown-has-asset" : ""}
        aria-expanded={open ? "true" : "false"}
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
      >
        {selected?.leadingAsset ? selected.leadingAsset : null}

        {selected ? (
          <span className="xendit-dropdown-button-title xendit-text-14">
            {selected.shortTitle ?? selected.title}
          </span>
        ) : (
          <span className="xendit-dropdown-button-title xendit-text-14 xendit-text-secondary">
            {placeholder}
          </span>
        )}

        <Icon
          className="xendit-dropdown-chevron"
          name="chevron"
          size={16}
          direction={"down"}
        />
      </button>

      {open ? (
        <div className="xendit-dropdown-menu">
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
                    {opt.leadingAsset ? opt.leadingAsset : null}
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
