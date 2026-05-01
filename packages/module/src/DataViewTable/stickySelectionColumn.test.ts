import {
  computeStickyLeftOffset,
  getFirstStickyColumnIndex,
  mergeFirstStickyDataColumnProps,
  mergeLeadingStickyDataColumnProps,
  shouldIncludeStickySelectionColumn,
  STICKY_SELECTION_COLUMN_WIDTH,
  stickySelectionCellProps,
} from './stickySelectionColumn';

describe('stickySelectionColumn', () => {
  describe('stickySelectionCellProps', () => {
    it('matches row-selection sticky grouping props', () => {
      expect(stickySelectionCellProps).toEqual({
        isStickyColumn: true,
        hasRightBorder: false,
        stickyMinWidth: STICKY_SELECTION_COLUMN_WIDTH,
      });
    });
  });

  describe('getFirstStickyColumnIndex', () => {
    it('returns the first sticky column index', () => {
      expect(
        getFirstStickyColumnIndex([
          null,
          { cell: 'Name', props: { isStickyColumn: true } },
          { cell: 'Tags' },
        ])
      ).toBe(1);
    });

    it('returns -1 when no sticky column exists', () => {
      expect(getFirstStickyColumnIndex([ { cell: 'Name' } ])).toBe(-1);
    });
  });

  describe('shouldIncludeStickySelectionColumn', () => {
    it('is true when table is sticky, selectable, and first sticky column exists', () => {
      expect(
        shouldIncludeStickySelectionColumn(
          [ { cell: 'Name', props: { isStickyColumn: true } } ],
          true,
          true
        )
      ).toBe(true);
    });

    it('is true when the first sticky column follows a null placeholder', () => {
      expect(
        shouldIncludeStickySelectionColumn(
          [ null, { cell: 'Name', props: { isStickyColumn: true } } ],
          true,
          true
        )
      ).toBe(true);
    });

    it('is false when table is not sticky', () => {
      expect(
        shouldIncludeStickySelectionColumn(
          [ { cell: 'Name', props: { isStickyColumn: true } } ],
          true,
          false
        )
      ).toBe(false);
    });

    it('is false when not selectable', () => {
      expect(
        shouldIncludeStickySelectionColumn(
          [ { cell: 'Name', props: { isStickyColumn: true } } ],
          false,
          true
        )
      ).toBe(false);
    });

    it('is false when no column is sticky', () => {
      expect(
        shouldIncludeStickySelectionColumn(
          [ { cell: 'Name', props: { isStickyColumn: false } } ],
          true,
          true
        )
      ).toBe(false);
    });

    it('is false when columns is empty', () => {
      expect(shouldIncludeStickySelectionColumn([], true, true)).toBe(false);
    });
  });

  describe('computeStickyLeftOffset', () => {
    const leadingStickyColumns = [
      { cell: '', props: { isStickyColumn: true, stickyMinWidth: '3rem' } },
      { cell: 'Name', props: { isStickyColumn: true, hasRightBorder: true } },
      { cell: 'Tags' },
    ];

    it('returns the first sticky column width when selection is not included', () => {
      expect(computeStickyLeftOffset(leadingStickyColumns, 1, false)).toBe('3rem');
    });

    it('combines selection and first sticky column widths', () => {
      expect(computeStickyLeftOffset(leadingStickyColumns, 1, true)).toBe(
        `calc(${STICKY_SELECTION_COLUMN_WIDTH} + 3rem)`
      );
    });

    it('returns selection width for the first sticky data column when only one sticky column exists', () => {
      expect(
        computeStickyLeftOffset([ { cell: 'Name', props: { isStickyColumn: true } } ], 0, true)
      ).toBeUndefined();
    });
  });

  describe('mergeFirstStickyDataColumnProps', () => {
    it('adds stickyLeftOffset when including selection sticky', () => {
      expect(
        mergeFirstStickyDataColumnProps(
          { isStickyColumn: true, hasRightBorder: true },
          true
        )
      ).toEqual({
        isStickyColumn: true,
        hasRightBorder: true,
        stickyLeftOffset: STICKY_SELECTION_COLUMN_WIDTH,
      });
    });

    it('preserves existing stickyLeftOffset', () => {
      expect(
        mergeFirstStickyDataColumnProps(
          { isStickyColumn: true, stickyLeftOffset: '80px' },
          true
        )
      ).toEqual({
        isStickyColumn: true,
        stickyLeftOffset: '80px',
      });
    });

    it('does not merge when first column is not sticky', () => {
      expect(
        mergeFirstStickyDataColumnProps({ isStickyColumn: false }, true)
      ).toEqual({ isStickyColumn: false });
    });

    it('returns column props unchanged when not including sticky selection', () => {
      const props = { isStickyColumn: true, hasRightBorder: true };
      expect(mergeFirstStickyDataColumnProps(props, false)).toBe(props);
    });

    it('returns undefined when column props are undefined', () => {
      expect(mergeFirstStickyDataColumnProps(undefined, true)).toBeUndefined();
    });
  });

  describe('mergeLeadingStickyDataColumnProps', () => {
    const leadingStickyColumns = [
      { cell: '', props: { isStickyColumn: true, stickyMinWidth: '3rem' } },
      { cell: 'Name', props: { isStickyColumn: true, hasRightBorder: true } },
      { cell: 'Tags' },
    ];

    it('offsets the second sticky column from the columns definition', () => {
      expect(
        mergeLeadingStickyDataColumnProps(
          { isStickyColumn: true, hasRightBorder: true },
          1,
          leadingStickyColumns,
          false
        )
      ).toEqual({
        isStickyColumn: true,
        hasRightBorder: true,
        stickyLeftOffset: '3rem',
      });
    });

    it('uses the columns definition stickyMinWidth for body cells', () => {
      expect(
        mergeLeadingStickyDataColumnProps(
          { isStickyColumn: true, stickyMinWidth: '4rem' },
          0,
          leadingStickyColumns,
          false
        )
      ).toEqual({
        isStickyColumn: true,
        stickyMinWidth: '3rem',
        style: { width: '3rem', minWidth: '3rem', maxWidth: '3rem' },
      });
    });

    it('applies selection offset on the first sticky data column', () => {
      expect(
        mergeLeadingStickyDataColumnProps(
          { isStickyColumn: true, hasRightBorder: true },
          0,
          [ { cell: 'Name', props: { isStickyColumn: true } } ],
          true
        )
      ).toEqual({
        isStickyColumn: true,
        hasRightBorder: true,
        stickyLeftOffset: STICKY_SELECTION_COLUMN_WIDTH,
      });
    });

    it('combines selection and leading sticky offsets for later sticky columns', () => {
      expect(
        mergeLeadingStickyDataColumnProps(
          { isStickyColumn: true, hasRightBorder: true },
          1,
          leadingStickyColumns,
          true
        )
      ).toEqual({
        isStickyColumn: true,
        hasRightBorder: true,
        stickyLeftOffset: `calc(${STICKY_SELECTION_COLUMN_WIDTH} + 3rem)`,
      });
    });
  });
});
