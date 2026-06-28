import React from 'react';

type AutocompletePrimitiveValue = string | number;

type NoInfer<T> = [T][T extends any ? 0 : never];

export type IOption<TValue extends AutocompletePrimitiveValue = string> =
  Omit<
    React.OptionHTMLAttributes<HTMLOptionElement>,
    'value' | 'label' | 'children'
  > & {
    value?: TValue | null;
    label?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  };

export interface AutocompleteChangeEvent<TValue = unknown> {
  target: {
    name: string;
    value: TValue;
  };
  currentTarget: HTMLDivElement;
  nativeEvent: Event;
  preventDefault: () => void;
  stopPropagation: () => void;
}

type BaseAutocompleteProps<TValue extends AutocompletePrimitiveValue = string> =
  Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    | 'onChange'
    | 'onInput'
    | 'onKeyDown'
    | 'onFocus'
    | 'onBlur'
    | 'value'
    | 'defaultValue'
    | 'multiple'
  > & {
    options?: IOption<TValue>[];
    placeholder?: string;
    maxRenderedOptions?: number;
    onInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
  };

type UseFormFieldSyncEvent = CustomEvent<{ value?: unknown; }>;
type SingleAutocompleteProps<TValue extends AutocompletePrimitiveValue = string,
> = BaseAutocompleteProps<TValue> & {
  multiple?: false;
  value?: NoInfer<TValue> | '' | null | undefined;
  defaultValue?: NoInfer<TValue> | '' | null | undefined;
  onChange?: (event: AutocompleteChangeEvent<TValue | ''>) => void;
};

type MultipleAutocompleteProps<TValue extends AutocompletePrimitiveValue = string,
> = BaseAutocompleteProps<TValue> & {
  multiple: true;
  value?: NoInfer<TValue>[] | null | undefined;
  defaultValue?: NoInfer<TValue>[] | null | undefined;
  onChange?: (event: AutocompleteChangeEvent<TValue[]>) => void;
};

export type IAutocompleteProps<TValue extends AutocompletePrimitiveValue = string> = SingleAutocompleteProps<TValue> | MultipleAutocompleteProps<TValue>;

function extractOptionsFromChildren<TValue extends AutocompletePrimitiveValue = string>(children: React.ReactNode): IOption<TValue>[] {
  const optionList: IOption<TValue>[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== 'option') return;

    const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;

    if (props.value === undefined || props.value === null) {
      optionList.push({
        ...(props as Omit<IOption<TValue>, 'value' | 'label' | 'children'>),
        value: undefined,
        label: props.label ?? props.children?.toString() ?? '',
        children: props.children,
      });

      return;
    }

    optionList.push({
      ...(props as Omit<IOption<TValue>, 'value' | 'label' | 'children'>),
      value: props.value as TValue,
      label: props.label ?? props.children?.toString() ?? props.value.toString(),
      children: props.children,
    });
  });

  return optionList;
}

function normalizeOptions<TValue extends AutocompletePrimitiveValue>(
  options?: IOption<TValue>[],
  children?: React.ReactNode,
): IOption<TValue>[] {
  if (options && options.length > 0) return options;
  if (children) return extractOptionsFromChildren<TValue>(children);
  return [];
}

function hasOptionValue<TValue extends AutocompletePrimitiveValue>(
  option: IOption<TValue>,
): option is IOption<TValue> & { value: TValue } {
  return option.value !== undefined && option.value !== null;
}

function getOptionLabel<TValue extends AutocompletePrimitiveValue>(
  option: IOption<TValue>,
): string {
  return option.label ?? option.value?.toString() ?? '';
}

function getOptionKey<TValue extends AutocompletePrimitiveValue>(
  option: IOption<TValue>,
): string {
  return option.value != null ? String(option.value) : '';
}

function createKeySetFromValue(value: unknown): Set<string> {
  if (Array.isArray(value)) {
    return new Set(
      value
        .filter((item) => item !== undefined && item !== null && item !== '')
        .map(String),
    );
  }

  if (value !== undefined && value !== null && value !== '') {
    return new Set([String(value)]);
  }

  return new Set();
}

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;

  for (const value of a) {
    if (!b.has(value)) return false;
  }

  return true;
}

export function Autocomplete<TValue extends AutocompletePrimitiveValue = string>({
  options: optionsProp,
  children,
  placeholder = 'Selecione...',
  multiple,
  disabled = false,
  required = false,
  maxRenderedOptions = 50,
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  onBlur,
  onFocus,
  onInput,
  onKeyDown,
  className,
  id,
  ...restProps
}: IAutocompleteProps<TValue>) {
  const isMultiple = Boolean(multiple);
  const isControlledComponent = controlledValue !== undefined;

  const autocompleteContainerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const hiddenSelectRef = React.useRef<HTMLSelectElement>(null);
  const isSelectingOptionPointerRef = React.useRef(false);

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [highlightedOptionIndex, setHighlightedOptionIndex] =
    React.useState(-1);
  const [isPending, startTransition] = React.useTransition();

  const initialSelectedKeySet = React.useMemo(
    () =>
      createKeySetFromValue(
        isControlledComponent ? controlledValue : defaultValue,
      ),
    // defaultValue é apenas valor inicial do componente não-controlado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [internalSelectedKeySet, setInternalSelectedKeySet] =
    React.useState<Set<string>>(() => initialSelectedKeySet);

  const selectedKeySetRef = React.useRef<Set<string>>(initialSelectedKeySet);
  const lastKnownSelectedKeySetRef = React.useRef<Set<string>>(initialSelectedKeySet);

  const allOptionList = React.useMemo(
    () => normalizeOptions<TValue>(optionsProp, children),
    [optionsProp, children],
  );

  const optionByKeyMap = React.useMemo(() => {
    const map = new Map<string, IOption<TValue>>();

    allOptionList.forEach((option) => {
      if (!hasOptionValue(option)) return;

      map.set(getOptionKey(option), option);
    });

    return map;
  }, [allOptionList]);

  const valueByKeyMap = React.useMemo(() => {
    const map = new Map<string, TValue>();

    allOptionList.forEach((option) => {
      if (!hasOptionValue(option)) return;

      map.set(getOptionKey(option), option.value);
    });

    return map;
  }, [allOptionList]);

  const selectedKeySet = React.useMemo<Set<string>>(() => {
    if (isControlledComponent) {
      return createKeySetFromValue(controlledValue);
    }

    return internalSelectedKeySet;
  }, [controlledValue, internalSelectedKeySet, isControlledComponent]);

  const selectedKeyArray = React.useMemo(
    () => Array.from(selectedKeySet),
    [selectedKeySet],
  );

  const searchableOptionList = React.useMemo(() => {
    return allOptionList.map((option) => {
      const hasValue = hasOptionValue(option);
      const key = hasValue ? getOptionKey(option) : '';
      const label = getOptionLabel(option);

      return {
        option,
        key,
        label,
        labelSearch: label.toLowerCase(),
        disabled: Boolean(option.disabled) || !hasValue,
      };
    });
  }, [allOptionList]);

  const emitChange = React.useCallback(
    (nextKeySet: Set<string>) => {
      const selectedValues = Array.from(nextKeySet)
        .map((key) => valueByKeyMap.get(key))
        .filter((value): value is TValue => value !== undefined);

      const nextValue = isMultiple ? selectedValues : selectedValues[0] ?? '';

      const changeEvent: AutocompleteChangeEvent<TValue | TValue[] | ''> = {
        target: {
          name: name ?? '',
          value: nextValue,
        },
        currentTarget: autocompleteContainerRef.current!,
        nativeEvent: new Event('change', { bubbles: true }),
        preventDefault: () => { },
        stopPropagation: () => { },
      };

      (
        onChange as
        | ((event: AutocompleteChangeEvent<TValue | TValue[] | ''>) => void)
        | undefined
      )?.(changeEvent);
    },
    [isMultiple, name, onChange, valueByKeyMap],
  );

  const readSelectionFromHiddenSelect = React.useCallback((): Set<string> => {
    const select = hiddenSelectRef.current;
    const nextKeySet = new Set<string>();

    if (!select) return nextKeySet;

    Array.from(select.options).forEach((option) => {
      if (option.selected) {
        nextKeySet.add(option.value);
      }
    });

    return nextKeySet;
  }, []);

  const syncHiddenSelectFromSelection = React.useCallback((nextKeySet: Set<string>) => {
    const select = hiddenSelectRef.current;

    if (!select) {
      return;
    }

    Array.from(select.options).forEach((option) => {
      option.selected = nextKeySet.has(option.value);
    });
  }, []);

  const readCurrentSelectionForUserAction = React.useCallback((): Set<string> => {
    const nextKeySet = new Set(selectedKeySet);

    if (!isControlledComponent) {
      selectedKeySetRef.current.forEach((key) => {
        nextKeySet.add(key);
      });

      lastKnownSelectedKeySetRef.current.forEach((key) => {
        nextKeySet.add(key);
      });

      readSelectionFromHiddenSelect().forEach((key) => {
        nextKeySet.add(key);
      });
    }

    return nextKeySet;
  }, [isControlledComponent, readSelectionFromHiddenSelect, selectedKeySet]);

  const syncFromExternalValue = React.useCallback((value: unknown) => {
    if (isControlledComponent) return;

    const nextKeySet = createKeySetFromValue(value);

    selectedKeySetRef.current = nextKeySet;
    lastKnownSelectedKeySetRef.current = nextKeySet;
    syncHiddenSelectFromSelection(nextKeySet);
    setInternalSelectedKeySet(nextKeySet);
  }, [isControlledComponent, syncHiddenSelectFromSelection]);

  React.useLayoutEffect(() => {
    selectedKeySetRef.current = selectedKeySet;

    if (isControlledComponent) {
      lastKnownSelectedKeySetRef.current = selectedKeySet;
      syncHiddenSelectFromSelection(selectedKeySet);
    }
  }, [isControlledComponent, selectedKeySet, syncHiddenSelectFromSelection]);

  const applySelection = React.useCallback(
    (nextKeySet: Set<string>, options?: { emit?: boolean }) => {
      selectedKeySetRef.current = nextKeySet;
      lastKnownSelectedKeySetRef.current = nextKeySet;

      syncHiddenSelectFromSelection(nextKeySet);

      if (!isControlledComponent) {
        setInternalSelectedKeySet(nextKeySet);
      }

      if (options?.emit) {
        emitChange(nextKeySet);
      }
    },
    [emitChange, isControlledComponent, syncHiddenSelectFromSelection],
  );

  const syncFromHiddenSelect = React.useCallback(() => {
    if (isControlledComponent) {
      return;
    }
    const nextKeySet = readSelectionFromHiddenSelect();

    selectedKeySetRef.current = nextKeySet;
    lastKnownSelectedKeySetRef.current = nextKeySet;

    setInternalSelectedKeySet((current) => {
      if (areSetsEqual(current, nextKeySet)) {
        return current;
      }

      return nextKeySet;
    });
  }, [isControlledComponent, readSelectionFromHiddenSelect]);

  React.useLayoutEffect(() => {
    const select = hiddenSelectRef.current;
    if (!select) return;

    const handleFieldSync = (event: Event) => {
      const syncEvent = event as UseFormFieldSyncEvent;
      const hasExternalValue =
        syncEvent.detail &&
        Object.prototype.hasOwnProperty.call(syncEvent.detail, "value");

      if (hasExternalValue) {
        syncFromExternalValue(syncEvent.detail.value);
        return;
      }

      syncFromHiddenSelect();
    };

    select.addEventListener("useform:field-sync", handleFieldSync);

    const form = select.closest("form");

    const handleFormReset = () => {
      requestAnimationFrame(() => {
        syncFromHiddenSelect();
      });
    };

    form?.addEventListener("reset", handleFormReset);

    return () => {
      select.removeEventListener("useform:field-sync", handleFieldSync);
      form?.removeEventListener("reset", handleFormReset);
    };
  }, [syncFromExternalValue, syncFromHiddenSelect]);

  const updateSelectedKeySet = React.useCallback((nextKeySet: Set<string>) => {
    applySelection(nextKeySet, { emit: true });
  }, [applySelection]);

  const addMultipleKey = React.useCallback((key: string) => {
    const nextKeySet = readCurrentSelectionForUserAction();

    nextKeySet.add(key);

    updateSelectedKeySet(nextKeySet);
  }, [readCurrentSelectionForUserAction, updateSelectedKeySet]);

  const removeKey = React.useCallback((key: string) => {
    const nextKeySet = readCurrentSelectionForUserAction();

    nextKeySet.delete(key);

    updateSelectedKeySet(nextKeySet);
  }, [readCurrentSelectionForUserAction, updateSelectedKeySet]);

  const clearAllSelections = React.useCallback(() => {
    updateSelectedKeySet(new Set());
    setSearchText('');
    searchInputRef.current?.focus();
  }, [updateSelectedKeySet]);

  const [filteredOptionList, setFilteredOptionList] =
    React.useState<IOption<TValue>[]>(allOptionList.slice(0, maxRenderedOptions));
  const [hasMoreFilteredOptions, setHasMoreFilteredOptions] =
    React.useState(allOptionList.length > maxRenderedOptions);

  React.useEffect(() => {
    const search = searchText.toLowerCase().trim();
    const renderLimit = Math.max(maxRenderedOptions, 1);

    startTransition(() => {
      const nextFilteredOptionList: IOption<TValue>[] = [];
      let hasMoreResults = false;

      for (const item of searchableOptionList) {
        if (item.disabled) continue;
        if (isMultiple && selectedKeySet.has(item.key)) continue;
        if (search && !item.labelSearch.includes(search)) continue;

        if (nextFilteredOptionList.length >= renderLimit) {
          hasMoreResults = true;
          break;
        }

        nextFilteredOptionList.push(item.option);
      }

      setFilteredOptionList(nextFilteredOptionList);
      setHasMoreFilteredOptions(hasMoreResults);
    });
  }, [isMultiple, maxRenderedOptions, searchText, searchableOptionList, selectedKeySet]);

  const selectedOptionItem = React.useMemo(() => {
    if (isMultiple) return null;

    const selectedKey = selectedKeyArray[0];

    if (!selectedKey) return null;

    return optionByKeyMap.get(selectedKey) ?? null;
  }, [isMultiple, optionByKeyMap, selectedKeyArray]);

  const displayValue = React.useMemo(() => {
    if (isDropdownOpen) {
      return searchText;
    }

    return selectedOptionItem ? getOptionLabel(selectedOptionItem) : '';
  }, [isDropdownOpen, searchText, selectedOptionItem]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchText('');
        setHighlightedOptionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openDropdown = React.useCallback(() => {
    if (!disabled) {
      setIsDropdownOpen(true);
      setHighlightedOptionIndex(-1);
    }
  }, [disabled]);

  const closeDropdown = React.useCallback(() => {
    setIsDropdownOpen(false);
    setSearchText('');
    setHighlightedOptionIndex(-1);
  }, []);

  const selectOptionItem = React.useCallback(
    (key: string) => {
      const option = optionByKeyMap.get(key);

      if (!option || option.disabled) {
        return;
      }

      if (isMultiple) {
        addMultipleKey(key);

        setSearchText('');
        setHighlightedOptionIndex(-1);
        searchInputRef.current?.focus();

        return;
      }

      updateSelectedKeySet(new Set([key]));
      setSearchText('');
      closeDropdown();
    },
    [
      addMultipleKey,
      closeDropdown,
      isMultiple,
      optionByKeyMap,
      updateSelectedKeySet,
    ],
  );

  const handleSearchInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      setSearchText(newValue);
      openDropdown();
      setHighlightedOptionIndex(-1);

      onInput?.(event);
    },
    [onInput, openDropdown],
  );

  const handleSearchKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = event;
      const optionsToRender = filteredOptionList.slice(0, maxRenderedOptions);

      if (
        key === 'Backspace' &&
        searchText === '' &&
        isMultiple &&
        selectedKeySet.size > 0
      ) {
        const lastKey = Array.from(selectedKeySet).pop();

        if (lastKey) {
          removeKey(lastKey);
        }

        return;
      }

      if (key === 'Escape') {
        closeDropdown();
        searchInputRef.current?.blur();
        return;
      }

      if (!isDropdownOpen && key !== 'Tab') {
        openDropdown();
      }

      if (key === 'ArrowDown') {
        event.preventDefault();

        setHighlightedOptionIndex((previous) => {
          const next = previous + 1;
          return next >= optionsToRender.length ? 0 : next;
        });

        return;
      }

      if (key === 'ArrowUp') {
        event.preventDefault();

        setHighlightedOptionIndex((previous) => {
          const next = previous - 1;
          return next < 0 ? optionsToRender.length - 1 : next;
        });

        return;
      }

      if (
        key === 'Enter' &&
        highlightedOptionIndex >= 0 &&
        highlightedOptionIndex < optionsToRender.length
      ) {
        event.preventDefault();

        const option = optionsToRender[highlightedOptionIndex];

        if (!hasOptionValue(option)) return;

        selectOptionItem(getOptionKey(option));

        return;
      }

      onKeyDown?.(event);
    },
    [
      closeDropdown,
      filteredOptionList,
      highlightedOptionIndex,
      isDropdownOpen,
      isMultiple,
      maxRenderedOptions,
      onKeyDown,
      openDropdown,
      removeKey,
      searchText,
      selectOptionItem,
      selectedKeySet,
    ],
  );

  const handleContainerClick = React.useCallback(() => {
    if (!disabled) {
      searchInputRef.current?.focus();
      openDropdown();
    }
  }, [disabled, openDropdown]);

  const handleContainerFocus = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleContainerBlur = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget as Node | null;

      if (
        autocompleteContainerRef.current &&
        relatedTarget &&
        autocompleteContainerRef.current.contains(relatedTarget)
      ) {
        return;
      }

      closeDropdown();
      onBlur?.(event);
    },
    [closeDropdown, onBlur],
  );

  const handleSearchInputFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (!isMultiple && selectedOptionItem) {
        setSearchText(getOptionLabel(selectedOptionItem));
      } else {
        setSearchText('');
      }

      openDropdown();

      setTimeout(() => {
        event.target.select();
      }, 0);
    },
    [isMultiple, openDropdown, selectedOptionItem],
  );

  const shouldIgnorePointerSideEffect = React.useCallback((event: React.MouseEvent) => {
    if (!isSelectingOptionPointerRef.current) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    return true;
  }, []);

  const handleChipRemoveClick = React.useCallback(
    (key: string, event: React.MouseEvent) => {
      if (shouldIgnorePointerSideEffect(event)) {
        return;
      }

      event.stopPropagation();
      removeKey(key);
    },
    [removeKey, shouldIgnorePointerSideEffect],
  );

  const handleClearAllClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (shouldIgnorePointerSideEffect(event)) {
        return;
      }

      event.stopPropagation();
      clearAllSelections();
    },
    [clearAllSelections, shouldIgnorePointerSideEffect],
  );

  const renderChips = () => {
    if (!isMultiple) return null;

    return selectedKeyArray.map((key) => {
      const option = optionByKeyMap.get(key);
      const label = option ? getOptionLabel(option) : key;

      return (<span
        key={key}
        className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-800 whitespace-nowrap"
        data-value={key}
        data-autocomplete-selected-value={key}
      >
        <span className='max-w-30 truncate'>{label}</span>

        <button
          type='button'
          className='ml-1 text-base leading-none text-sky-700 opacity-70 hover:opacity-100'
          onClick={(event) => handleChipRemoveClick(key, event)}
          disabled={disabled}
          aria-label={`Remover ${label}`}
        >
          ×
        </button>
      </span>);
    });
  };

  const renderSearchInput = () => (
    <input
      ref={searchInputRef}
      type='text'
      className='flex-1 min-w-20 border-none bg-transparent px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed'
      placeholder={isMultiple && selectedKeySet.size > 0 ? '' : placeholder}
      value={displayValue}
      onChange={handleSearchInputChange}
      onKeyDown={handleSearchKeyDown}
      onFocus={handleSearchInputFocus}
      disabled={disabled}
      autoComplete='off'
      role='combobox'
      aria-expanded={isDropdownOpen}
      aria-controls={`${name}-dropdown`}
      aria-haspopup='listbox'
    />
  );

  const renderDropdown = () => {
    if (!isDropdownOpen) return null;

    if (filteredOptionList.length === 0 && !isPending) {
      return (
        <ul
          id={`${name}-dropdown`}
          className='absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl list-none'
          role='listbox'
        >
          <li
            className='px-3 py-2 text-center text-sm text-slate-500'
            role='option'
            aria-selected={false}
          >
            Nenhuma opção encontrada
          </li>
        </ul>
      );
    }

    const optionsToRender = filteredOptionList.slice(0, maxRenderedOptions);

    return (
      <ul
        id={`${name}-dropdown`}
        className='absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl list-none'
        role='listbox'
      >
        {isPending && (
          <li
            className='px-3 py-1 text-center text-xs text-slate-400'
            aria-hidden='true'
          >
            Carregando...
          </li>
        )}

        {optionsToRender.map((option, index) => {
          if (!hasOptionValue(option)) {
            return null;
          }

          const key = getOptionKey(option);
          const label = getOptionLabel(option);
          const isHighlighted = index === highlightedOptionIndex;

          return (
            <li
              key={key}
              role='option'
              aria-selected={selectedKeySet.has(key)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${isHighlighted
                ? 'bg-sky-50 text-sky-800'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();

                isSelectingOptionPointerRef.current = true;
                selectOptionItem(key);

                window.setTimeout(() => {
                  isSelectingOptionPointerRef.current = false;
                }, 0);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseEnter={() => setHighlightedOptionIndex(index)}
            >
              {label}
            </li>
          );
        })}

        {hasMoreFilteredOptions && (
          <li
            className='border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-400'
            aria-hidden='true'
          >
            Mostrando os primeiros {maxRenderedOptions} resultados. Refine a busca para ver opções mais específicas.
          </li>
        )}
      </ul>
    );
  };

  return (
    <div
      ref={autocompleteContainerRef}
      className={`relative w-full cursor-text rounded-xl border border-slate-300 bg-white font-sans transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : ''
        } ${className ?? ''}`}
      onClick={handleContainerClick}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      id={id}
    >
      <div className='flex flex-wrap items-center gap-1 p-1 min-h-10'>
        {renderChips()}
        {renderSearchInput()}

        {isMultiple && selectedKeySet.size > 0 && (
          <button
            type='button'
            className='ml-auto bg-transparent border-none text-slate-500 hover:text-slate-700 text-xl leading-none px-1 opacity-70 hover:opacity-100'
            onClick={handleClearAllClick}
            disabled={disabled}
            aria-label='Remover todos'
          >
            ×
          </button>
        )}
      </div>

      <select
        ref={hiddenSelectRef}
        name={name}
        multiple={isMultiple}
        required={required}
        disabled={disabled}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        defaultValue={
          isMultiple
            ? Array.from(initialSelectedKeySet)
            : Array.from(initialSelectedKeySet)[0] ?? ""
        }
        onChange={syncFromHiddenSelect}
        {...restProps}
      >
        {allOptionList.map((option, index) => {
          const hasValue = hasOptionValue(option);
          const key = hasValue ? getOptionKey(option) : `__invalid_${index}`;

          return (
            <option
              key={key}
              value={hasValue ? key : ''}
              disabled={option.disabled || !hasValue}
            >
              {getOptionLabel(option)}
            </option>
          );
        })}
      </select>

      {renderDropdown()}
    </div>
  );
}