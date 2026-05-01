import { TdProps, ThProps } from '@patternfly/react-table';

/**
 * Min width / left offset for the row-selection column when it is grouped with a sticky first data column.
 * Sized for a typical checkbox column; tune if your selection column renders wider.
 */
export const STICKY_SELECTION_COLUMN_WIDTH = '4rem';

/** Default used when computing offsets for a preceding sticky column with no explicit stickyMinWidth. */
export const DEFAULT_STICKY_COLUMN_WIDTH = '120px';

/** Props applied to the injected checkbox Th/Td when they participate in a sticky first-column group */
export const stickySelectionCellProps: Pick<
  ThProps,
  'isStickyColumn' | 'hasRightBorder' | 'stickyMinWidth'
> = {
  isStickyColumn: true,
  hasRightBorder: false,
  stickyMinWidth: STICKY_SELECTION_COLUMN_WIDTH,
};

function isStickyColumnDefinition(column: unknown): boolean {
  return (
    column != null &&
    typeof column === 'object' &&
    'props' in column &&
    (column as { props?: { isStickyColumn?: boolean } }).props?.isStickyColumn === true
  );
}

function getStickyMinWidth(column: unknown): string | undefined {
  if (column == null || typeof column !== 'object' || !('props' in column)) {
    return undefined;
  }
  return (column as { props?: { stickyMinWidth?: string } }).props?.stickyMinWidth;
}

/** Index of the first column definition marked `isStickyColumn`, or -1 when none. */
export function getFirstStickyColumnIndex(columns: unknown[]): number {
  return columns.findIndex((column) => isStickyColumnDefinition(column));
}

export function shouldIncludeStickySelectionColumn(
  columns: unknown[],
  isSelectable: boolean,
  isStickyTable: boolean
): boolean {
  if (!isStickyTable || !isSelectable || columns.length === 0) {
    return false;
  }
  return getFirstStickyColumnIndex(columns) >= 0;
}

function sumCssWidths(first: string, second: string): string {
  return `calc(${first} + ${second})`;
}

/** Applies column-definition stickyMinWidth to sticky cells and locks width to prevent shifting during scroll. */
function applyColumnDefStickyWidth<P extends ThProps | TdProps>(
  columnProps: P,
  columnDefStickyMinWidth: string | undefined
): P {
  if (!columnDefStickyMinWidth) {
    return columnProps;
  }
  return {
    ...columnProps,
    stickyMinWidth: columnDefStickyMinWidth,
    style: {
      ...columnProps.style,
      width: columnDefStickyMinWidth,
      minWidth: columnDefStickyMinWidth,
      maxWidth: columnDefStickyMinWidth,
    },
  };
}

/**
 * Combined inset for a sticky column from preceding sticky columns in `columns`
 * and, when applicable, the injected selection column.
 */
export function computeStickyLeftOffset(
  columns: unknown[],
  colIndex: number,
  includeStickySelection: boolean
): string | undefined {
  const firstStickyIndex = getFirstStickyColumnIndex(columns);
  if (firstStickyIndex < 0 || colIndex <= firstStickyIndex) {
    return undefined;
  }

  let offset: string | undefined = includeStickySelection ? STICKY_SELECTION_COLUMN_WIDTH : undefined;

  for (let i = firstStickyIndex; i < colIndex; i++) {
    if (!isStickyColumnDefinition(columns[i])) {
      continue;
    }
    const width = getStickyMinWidth(columns[i]) ?? DEFAULT_STICKY_COLUMN_WIDTH;
    offset = offset ? sumCssWidths(offset, width) : width;
  }

  return offset;
}

/** Adds horizontal inset so the first sticky data column sits after the sticky selection column */
export function mergeFirstStickyDataColumnProps<P extends ThProps | TdProps>(
  columnProps: P | undefined,
  includeStickySelection: boolean
): P | undefined {
  if (!columnProps || !includeStickySelection || !columnProps.isStickyColumn) {
    return columnProps;
  }
  return {
    ...columnProps,
    stickyLeftOffset: columnProps.stickyLeftOffset ?? STICKY_SELECTION_COLUMN_WIDTH,
  };
}

/**
 * Applies sticky offsets for a leading group of sticky columns (selection + data, or multiple data columns).
 * Offsets are derived from the `columns` definition so header and body cells stay aligned while scrolling.
 * Only the rightmost column in the group should use `hasRightBorder: true`; earlier columns should not.
 */
export function mergeLeadingStickyDataColumnProps<P extends ThProps | TdProps>(
  columnProps: P | undefined,
  colIndex: number,
  columns: unknown[],
  includeStickySelection: boolean
): P | undefined {
  if (!columnProps?.isStickyColumn) {
    return columnProps;
  }

  const firstStickyIndex = getFirstStickyColumnIndex(columns);
  if (firstStickyIndex < 0) {
    return columnProps;
  }

  const columnDefStickyMinWidth = getStickyMinWidth(columns[colIndex]);
  let merged: P = applyColumnDefStickyWidth(columnProps, columnDefStickyMinWidth);

  if (merged.stickyLeftOffset != null) {
    return merged;
  }

  if (includeStickySelection && colIndex === firstStickyIndex) {
    return mergeFirstStickyDataColumnProps(merged, true);
  }

  const offset = computeStickyLeftOffset(columns, colIndex, includeStickySelection);
  if (offset != null) {
    merged = { ...merged, stickyLeftOffset: offset };
  }

  return merged;
}
