// Lightweight, dependency-free event bus for point-related events
type Handler = () => void;

let handlers: Handler[] = [];

export function onPointsRecorded(handler: Handler): () => void {
  handlers.push(handler);
  return () => {
    handlers = handlers.filter(h => h !== handler);
  };
}

export function emitPointsRecorded(): void {
  handlers.forEach(h => {
    try { h(); } catch (e) { console.error('Error in pointsRecorded handler', e); }
  });
}

export default { onPointsRecorded, emitPointsRecorded };
