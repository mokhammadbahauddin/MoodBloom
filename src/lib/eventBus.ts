type EventCallback = (payload: any) => void;

class DomainEventBus {
  private listeners: Record<string, EventCallback[]> = {};

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
    };
  }

  public publish(eventType: string, payload: any = {}): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(callback => {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for event ${eventType}:`, err);
      }
    });
  }
}

export const eventBus = new DomainEventBus();
