import {Context, EventMap, Subscriber, SubscriberContexts, Unsubscribe} from "./types";

export class PubSub<Events extends EventMap> {
    private listeners = new Map<keyof Events, Set<SubscriberContexts<any>>>();

    subscribe<K extends keyof Events>(event: K, contexts: Context[], callback: Subscriber<Events[K]>): Unsubscribe {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add([contexts, callback]);
        return () => {
            this.unsubscribe(event, [contexts, callback]);
        };
    }

    unsubscribe<K extends keyof Events>(event: K, subscriberContext: SubscriberContexts<Events[K]>): void {
        this.listeners.get(event)?.delete(subscriberContext);
    }

    publish<K extends keyof Events>(event: K, data: Events[K], meantForContexts: Context[] = ["*"]): void {
        const subs = this.listeners.get(event);
        if (subs) subs.forEach(sub => {
            // Do not send the message if the subscriber does not subscribe to the context the message was published for
            if (!sub[0].includes("*") && !sub[0].some(c => meantForContexts.includes(c))) return;
            sub[1](data);
        });
    }

    clear(event?: keyof Events): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}