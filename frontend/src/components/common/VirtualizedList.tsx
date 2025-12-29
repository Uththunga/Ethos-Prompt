/* eslint-disable react-refresh/only-export-components */

import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
  className?: string;
  overscanCount?: number;
}

/**
 * VirtualizedList component for rendering large lists efficiently
 * Uses react-window for virtualization to improve performance
 */
export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5
}: VirtualizedListProps<T>) {
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => items, [items]);

  // Memoized item renderer that passes the correct props
  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      return renderItem({ index, style, data: itemData });
    },
    [renderItem, itemData]
  );

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400">No items to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
      >
        {ItemRenderer}
      </List>
    </div>
  );
}

// Grid virtualization for card layouts
interface VirtualizedGridProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  itemsPerRow: number;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    data: T[];
    rowIndex: number;
    columnIndex: number;
  }) => React.ReactElement;
  className?: string;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  height,
  itemHeight,
  itemsPerRow,
  renderItem,
  className = '',
  gap = 16
}: VirtualizedGridProps<T>) {
  // Calculate number of rows needed
  const rowCount = Math.ceil(items.length / itemsPerRow);

  // Memoize the item data
  const itemData = useMemo(() => items, [items]);

  // Row renderer that handles multiple items per row
  const RowRenderer = useCallback(
    ({ index: rowIndex, style }: { index: number; style: React.CSSProperties }) => {
      const startIndex = rowIndex * itemsPerRow;

      return (
        <div style={style} className="flex" key={rowIndex}>
          {Array.from({ length: itemsPerRow }, (_, columnIndex) => {
            const itemIndex = startIndex + columnIndex;
            if (itemIndex >= items.length) return null;

            const itemStyle: React.CSSProperties = {
              width: `calc((100% - ${gap * (itemsPerRow - 1)}px) / ${itemsPerRow})`,
              marginRight: columnIndex < itemsPerRow - 1 ? gap : 0,
            };

            return (
              <div key={itemIndex} style={itemStyle}>
                {renderItem({
                  index: itemIndex,
                  style: {},
                  data: itemData,
                  rowIndex,
                  columnIndex
                })}
              </div>
            );
          })}
        </div>
      );
    },
    [items.length, itemsPerRow, gap, renderItem, itemData]
  );

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400">No items to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={rowCount}
        itemSize={itemHeight + gap}
        overscanCount={2}
      >
        {RowRenderer}
      </List>
    </div>
  );
}

// Hook for calculating optimal virtualization parameters
export function useVirtualizationParams(
  containerRef: React.RefObject<HTMLElement>,
  itemHeight: number,
  defaultHeight: number = 400
) {
  const [height, setHeight] = React.useState(defaultHeight);

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        setHeight(containerHeight > 0 ? containerHeight : defaultHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [containerRef, defaultHeight]);

  return {
    height,
    itemHeight,
    visibleItems: Math.ceil(height / itemHeight)
  };
}
