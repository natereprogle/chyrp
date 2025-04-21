import type {Adapter, Context, EventMap, MessageEnvelope} from "../core";
import {isChyrpMessage} from "../utils/chyrp-typeguards";
import uid from 'tiny-uid'

export class PageScriptAdapter<Events extends EventMap> implements Adapter<Events> {
    name: Context = "window";
    readonly uid: string;
    readonly namespace: string;
    private callback?: (event: keyof Events, payload: Events[keyof Events]) => void;
    public handler: (event: MessageEvent) => void;

    constructor(namespace = "chyrp:v1") {
        this.namespace = namespace;
        this.uid = uid(20);

        console.debug(`[Chyrp:${this.name}] 🆕 Page Script Adapter created in namespace "${this.namespace}" with UID "${this.uid}"`);

        this.handler = (event: MessageEvent) => {
            // If the message was sent for a different namespace, or it was sent by this adapter, ignore it
            // Messages are only posted to the window if the content script detects it includes * or `window`, so we don't check for that here
            if (!isChyrpMessage<Events>(event.data, this.namespace) || event.data.meta.uid === this.uid) return;

            if (event.data.meta.source === this.name) return;

            this.callback?.(event.data.event, event.data.payload);
        }
    }

    send<K extends keyof Events>(event: K, payload: Events[K], meantFor: Context[] = ["*"]): void {
        const envelope: MessageEnvelope<K, Events> = {
            __chyrp: true,
            event,
            payload,
            meta: {
                namespace: this.namespace,
                uid: this.uid,
                source: this.name,
                meantFor
            }
        };

        // Page scripts can only send messages to the window and also browser.runtime *if* `externally_connectable` is set and they have the extension ID
        // Doing it this way removes that requirement, but mean that a content script has to be used to proxy messages to the runtime
        window.postMessage(envelope, "*");
    }

    onMessage(callback: (event: keyof Events, payload: Events[keyof Events]) => void): void {
        this.callback = callback;
        window.addEventListener("message", this.handler);
    }

    disconnect(): void {
        console.debug(`[Chyrp:${this.name}] 💣 Page Script Adapter in namespace "${this.namespace}" with UID "${this.uid}" is being disconnected`);
        window.removeEventListener("message", this.handler);
    }
}
