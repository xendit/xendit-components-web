import { ComponentChildren } from "preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import Icon from "./icon";
import { useIdSafe } from "../utils";

export type DropdownOption = {
  leadingAsset?: ComponentChildren; // e.g. flag/icon URL
  title: string; // primary line
  shortTitle?: string;
  description?: string; // secondary line
  disabled?: boolean;
  value: string;
};

type FilteredOption = {
  option: DropdownOption;
  originalIndex: number;
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const mapToFiltered = (
      opt: DropdownOption,
      index: number,
    ): FilteredOption => ({
      option: opt,
      originalIndex: index,
    });

    if (!searchQuery) {
      return options.map(mapToFiltered);
    }

    const filtered = options.map(mapToFiltered).filter(({ option: opt }) => {
      const query = searchQuery.toLowerCase();
      return (
        opt.title.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
      );
    });

    // Show all options if no results found
    return filtered.length > 0 ? filtered : options.map(mapToFiltered);
  }, [searchQuery, options]);

  // Ids for ARIA wiring
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const listboxId = `${id}-listbox`;

  const clampedActive = Math.max(
    0,
    Math.min(filteredOptions.length - 1, activeIndex),
  );
  const activeOptionId = filteredOptions[clampedActive]
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

  const scrollActiveIntoView = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView({ block: "end", behavior: "instant" });
  }, []);

  const commit = useCallback(
    (index: number, disabled?: boolean) => {
      if (disabled === true) return;
      const opt = options[index];
      if (!opt) return;
      if (!isControlled) setInternalIndex(index);
      onChange(opt, index);
      setOpen(false);
      btnRef.current?.focus();
    },
    [isControlled, onChange, options],
  );

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
      const isSearchInput =
        (e.target as HTMLElement)?.id === "dropdown-search-input";

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
          commit(activeItem.originalIndex, activeItem.option.disabled);
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
    [clampedActive, closeList, commit, filteredOptions],
  );

  const onOptionClick = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      commit(
        Number(event.currentTarget.dataset.index),
        Boolean(event.currentTarget.dataset.disabled),
      );
    },
    [commit],
  );

  const selected = currentIndex >= 0 ? options[currentIndex] : undefined;

  return (
    <div
      ref={rootRef}
      className={`xendit-dropdown ${className ?? ""}`}
      aria-expanded={open ? "true" : "false"}
      aria-controls={listboxId}
      aria-haspopup="listbox"
      aria-labelledby={labelId}
    >
      <button
        id={id}
        ref={btnRef}
        type="button"
        className={selected?.leadingAsset ? "xendit-dropdown-has-asset" : ""}
        aria-controls={listboxId}
        aria-expanded={open ? "true" : "false"}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={(e) => onButtonKeyDown(e as unknown as KeyboardEvent)}
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
        <div className="xendit-dropdown-menu" onClick={closeList}>
          <div className="xendit-dropdown-search">
            <input
              ref={searchInputRef}
              id="dropdown-search-input"
              placeholder={"Search.."}
              value={searchQuery}
              onInput={(e) => {
                setSearchQuery((e.target as HTMLInputElement).value);
                setActiveIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={onListKeyDown}
            />
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={activeOptionId}
            onKeyDown={onListKeyDown}
          >
            {filteredOptions.map(({ option: opt, originalIndex }, i) => {
              const isSelected = originalIndex === currentIndex;
              const isActive = i === clampedActive;
              return (
                <li
                  key={originalIndex}
                  role="option"
                  data-index={originalIndex}
                  data-disabled={opt.disabled ? true : undefined}
                  aria-disabled={opt.disabled ? true : undefined}
                  aria-selected={isSelected}
                  onClick={onOptionClick}
                  ref={isActive ? scrollActiveIntoView : undefined}
                >
                  <div
                    className={`xendit-dropdown-item xendit-text-14 ${isActive ? "is-active" : ""} ${opt.leadingAsset ? "xendit-dropdown-has-asset" : ""}`}
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
