export const smoothValue = (newValue, oldValue, factor) =>
    oldValue * factor + newValue * (1 - factor);

export const calculateDistance = (p1, p2) =>
    Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

export const addToBuffer = (state, value) => {
    state.distanceBuffer.push(value);
    if (state.distanceBuffer.length > state.bufferSize) state.distanceBuffer.shift();
    const sorted = [...state.distanceBuffer].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};
