/**
 * Pure functions for drag-and-drop operations, field reordering, and template insertion.
 */

/**
 * Reorders an item in an array from a source index to a target destination index.
 */
export function reorderList<T>(list: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= list.length) {
    return [...list];
  }

  const result = [...list];
  const [movedItem] = result.splice(fromIndex, 1);
  // When dragging down past an item, the target index shifts by 1 after removing fromIndex
  const destination = toIndex > fromIndex ? toIndex - 1 : toIndex;
  const clampedDestination = Math.max(0, Math.min(destination, result.length));
  result.splice(clampedDestination, 0, movedItem);

  return result;
}

/**
 * Inserts a new item at the target position, or appends it to the end if targetIndex is undefined.
 */
export function insertItemAt<T>(list: readonly T[], item: T, targetIndex?: number): T[] {
  const result = [...list];
  if (targetIndex === undefined || targetIndex >= result.length) {
    result.push(item);
  } else {
    const clamped = Math.max(0, targetIndex);
    result.splice(clamped, 0, item);
  }
  return result;
}

/**
 * Swaps two adjacent elements (up / down button fallback).
 */
export function swapAdjacent<T>(list: readonly T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return [...list];
  }
  const result = [...list];
  const temp = result[index];
  result[index] = result[targetIndex];
  result[targetIndex] = temp;
  return result;
}
