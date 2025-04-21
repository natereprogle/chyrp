/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
import type {Adapter, Context, EventMap, MessageEnvelope} from "../core";
import browser from "webextension-polyfill";
import {isChyrpMessage} from "../utils/chyrp-typeguards";
import uid from 'tiny-uid';

export class ContentScriptAdapter<Events extends EventMap> implements Adapter<Events> {
    readonly name: Context = "content-script";
    readonly uid: string;
    readonly namespace: string;

    private callback?: (event: keyof Events, payload: Events[keyof Events]) => void;
    public windowHandler: (event: MessageEvent) => void;
    public runtimeHandler: (msg: any, sender: browser.Runtime.MessageSender) => void;

    constructor(namespace = "chyrp:v1") {
        this.namespace = namespace;
        this.uid = uid(20);

        console.debug(`[Chyrp:${this.name}] 🆕 Content Script Adapter created in namespace "${this.namespace}" with UID "${this.uid}"`);

        this.windowHandler = (event: MessageEvent) => {
            if (!isChyrpMessage<Events>(event.data, this.namespace) || event.data.meta.uid === this.uid) return;
            const msg = event.data;

            // Forward to background/extension scripts
            browser.runtime.sendMessage(msg).catch((err: Error) => {
                if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
                console.warn(`[Chyrp:${this.name}] ⛔ Content Script in namespace "${this.namespace}" with UID "${this.uid}" failed to send message to runtime`, err);
            });

            // We don't call window.postMessage here because that would mean we're sending the exact same message back to the same window that sent it

            // Also fire local callback
            this.callback?.(msg.event, msg.payload);
        };

        this.runtimeHandler = (msg: any) => {
            // If the message is not a chyrp message, ignore it
            if (!isChyrpMessage<Events>(msg, this.namespace)) return;

            // We should forward messages to the window if they are meant for it
            // We have to do this first to avoid the uid and source checks meant for content scripts below.
            // We also make a structuredClone of it and update its meta to avoid duplicate processing in the runtime *and* window
            if (msg.meta.meantFor.includes("window") || msg.meta.meantFor.includes("*")) {
                const clone = structuredClone(msg);
                clone.meta.uid = this.uid;
                clone.meta.source = this.name;
                clone.meta.forwardedBy = this.name;
                window.postMessage(clone, "*");
            }

            // If the message was sent by this adapter, ignore it
            if (msg.meta.uid === this.uid) return;

            // If the message is not meant for this context, ignore it
            // If the meantFor contains a "*", it means the message is meant for all contexts, so we don't care if it contains this adapter type or not
            if (!msg.meta.meantFor.includes(this.name) && !msg.meta.meantFor.includes("*")) return;

            this.callback?.(msg.event, msg.payload);
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

        // Handles sending messages to runtime listeners like background script, popup, and options page
        browser.runtime.sendMessage(envelope).catch((err: Error) => {
            if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
            console.warn(`[Chyrp:${this.name}] ⛔ Content Script in namespace "${this.namespace}" with UID "${this.uid}" failed to send message to runtime`, err);
        });

        // Handles forwarding messages to the window
        window.postMessage(envelope, "*");
    }

    onMessage(callback: (event: keyof Events, payload: Events[keyof Events]) => void): void {
        this.callback = callback;

        // Listen to window messages
        window.addEventListener("message", this.windowHandler);

        // Listen to extension runtime
        browser.runtime.onMessage.addListener(this.runtimeHandler);
    }

    disconnect(): void {
        console.debug(`[Chyrp:${this.name}] 💣 Content Script Adapter in namespace "${this.namespace}" with UID "${this.uid}" is being disconnected`);
        window.removeEventListener("message", this.windowHandler);
        browser.runtime.onMessage.removeListener(this.runtimeHandler);
    }
}
