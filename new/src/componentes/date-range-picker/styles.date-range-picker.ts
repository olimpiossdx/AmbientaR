import type { DateRangePickerSize } from './propTypes.date-range-picker';

export const dateRangePickerStyles = {
  root: 'relative mb-4',
  label: {
    base: 'mb-1 block font-medium text-gray-700',
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
    } satisfies Record<DateRangePickerSize, string>,
    required: 'text-red-500',
  },
  control: {
    base: [
      'flex items-center overflow-hidden border border-gray-300 bg-white transition-colors',
      'focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500',
    ].join(' '),
    size: {
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
    } satisfies Record<DateRangePickerSize, string>,
    disabled: 'cursor-not-allowed bg-gray-100 opacity-60',
  },
  input: {
    base: 'flex-1 bg-transparent text-center text-gray-900 outline-none placeholder-gray-400',
    size: {
      sm: 'min-w-[4.5rem] px-2 py-1.5 text-xs',
      md: 'min-w-[5.5rem] p-2.5 text-sm',
      lg: 'min-w-[7rem] p-3.5 text-base',
    } satisfies Record<DateRangePickerSize, string>,
  },
  separator: 'shrink-0 px-1 text-gray-400',
  calendarButton: {
    base: 'shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none',
    size: {
      sm: 'p-1.5',
      md: 'p-2.5',
      lg: 'p-3.5',
    } satisfies Record<DateRangePickerSize, string>,
  },
  iconSize: {
    sm: 14,
    md: 18,
    lg: 22,
  } satisfies Record<DateRangePickerSize, number>,
  arrowSize: {
    sm: 12,
    md: 14,
    lg: 16,
  } satisfies Record<DateRangePickerSize, number>,
  panel: [
    'flex max-h-[min(32rem,calc(100vh-1rem))] overflow-y-auto overflow-x-hidden border border-gray-200 bg-white p-0 shadow-2xl',
    'flex-col sm:flex-row',
  ].join(' '),
  presets: {
    list: [
      'no-scrollbar flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 p-2',
      'sm:w-36 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r',
    ].join(' '),
    item: [
      'w-auto whitespace-nowrap rounded border border-transparent px-3 py-2 text-left text-xs text-gray-600 transition-all',
      'hover:border-gray-200 hover:bg-white hover:shadow-sm',
      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:shadow-none',
    ].join(' '),
  },
  navigation: {
    container: 'flex items-center justify-between border-b border-gray-200 bg-white p-2',
    button: 'rounded p-1 text-gray-500 hover:bg-gray-100',
    title: 'text-xs font-bold uppercase tracking-widest text-gray-500',
  },
  calendars: 'grid w-full min-w-0 grid-cols-1 bg-white sm:grid-cols-2',
  calendarWrapper: 'min-w-0 w-full',
  calendarDivider: 'sm:border-l sm:border-gray-200',
  nativeInput: 'sr-only',
};

export const calendarGridStyles = {
  root: 'w-full p-3',
  monthTitle: 'mb-4 text-center text-sm font-bold capitalize text-gray-900',
  weekHeader: 'mb-2 grid grid-cols-7 gap-1',
  weekDay: 'text-center text-[10px] font-bold text-gray-400',
  daysGrid: 'grid grid-cols-7 gap-1',
  day: {
    base: 'flex h-8 w-full items-center justify-center text-xs transition-all',
    normal: 'rounded-full text-gray-700 hover:bg-gray-100',
    disabled: 'cursor-not-allowed opacity-20',
    selected: 'relative z-10 bg-cyan-600 font-bold text-white shadow-md',
    inRange: 'bg-cyan-50 text-cyan-700',
    roundedFull: 'rounded-full',
    roundedNone: 'rounded-none',
    roundedLeft: 'rounded-l-full rounded-r-none',
    roundedRight: 'rounded-l-none rounded-r-full',
  },
};
