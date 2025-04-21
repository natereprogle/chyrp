export type EventMap = Record<string, any>;
export type Subscriber<T> = (payload: T) => void;
export type SubscriberContexts<T> = [Context[], Subscriber<T>];

export type Unsubscribe = () => void;

export interface MessageEnvelope<K extends keyof E, E extends EventMap = EventMap> {
    __chyrp?: true; // unique marker for library

    event: K;


    payload: E[K];

    meta: {
        namespace: string;
        uid: string;
        meantFor: Context[];
        [key: string]: any;
    }
}

export interface Adapter<Events extends EventMap> {
    name: Context;

    uid: string;

    namespace: string;

    send<K extends keyof Events>(event: K, payload: Events[K], meantFor?: Context[]): void;

    onMessage(callback: (event: keyof Events, payload: Events[keyof Events]) => void): void;

    disconnect?(): void;
}

export type Context =
    "persistent-port"
    | "devtools"
    | "background"
    | "popup"
    | "options"
    | "content-script"
    | "window"
    | "sidepanel"
    | "*";

export type PageContext =
    "popup"
    | "options"
    | "window"