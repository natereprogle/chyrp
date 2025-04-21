/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
import type {Adapter, Context, EventMap, MessageEnvelope, PageContext} from "../core";
import browser from "webextension-polyfill";
import {isChyrpMessage} from "../utils/chyrp-typeguards";
import uid from 'tiny-uid';

export class ExtensionPageAdapter<Events extends EventMap> implements Adapter<Events> {
    readonly name: Context;
    readonly uid: string;
    readonly namespace: string;
    private callback?: (event: keyof Events, payload: Events[keyof Events]) => void;

    public handler: (msg: any, sender: browser.Runtime.MessageSender) => void;

    constructor(namespace = "chyrp:v1", name: PageContext = "popup") {
        this.namespace = namespace;
        this.name = name;
        this.uid = uid(20);

        console.debug(`[Chyrp:${this.name}] 🆕 Extension Page Adapter created in namespace "${this.namespace}" with UID "${this.uid}"`);

        this.handler = (msg) => {
            // If the message was sent for a different namespace, or it was sent by this adapter, ignore it
            if (!isChyrpMessage<Events>(msg, this.namespace) || msg.meta.uid === this.uid) return;

            // If the message is not meant for this context, ignore it
            // If the meantFor contains a "*", it means the message is meant for all contexts, so we don't care if it contains this adapter type or not
            if (!msg.meta.meantFor.includes(this.name) && !msg.meta.meantFor.includes("*")) return;

            this.callback?.(msg.event, msg.payload);
        };
    }

    send<K extends keyof Events>(event: K, payload: Events[K], meantFor: Context[] = ["*"]) {
        const envelope: MessageEnvelope<K, Events> = {
            __chyrp: true,
            event,
            payload,
            meta: {
                namespace: this.namespace,
                uid: this.uid,
                meantFor
            }
        }

        // Handles sending messages to runtime listeners
        browser.runtime.sendMessage(envelope).catch((err: Error) => {
            if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
            console.warn(`[Chyrp:${this.name}] ⛔ Extension Page Adapter in namespace "${this.namespace}" with UID "${this.uid}" failed to send message to runtime`, err);
        });

        // Handles sending messages to content scripts and windows
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        browser.tabs.query({}).then(tabs => {
            tabs.forEach(tab => {
                if (tab.id === undefined) return;
                browser.tabs.sendMessage(tab.id, envelope).catch((err: Error) => {
                    if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    console.warn(`[Chyrp:${this.name}] ⛔ Extension Page Adapter in namespace "${this.namespace}" with UID "${this.uid}" failed to send message to tab with ID "${tab.id}"`, err);
                });
            })
        })
    }

    onMessage(callback: (event: keyof Events, payoad: Events[keyof Events]) => void): void {
        this.callback = callback;
        browser.runtime.onMessage.addListener(this.handler);
        // browser.runtime.onMessageExternal.addListener(this.handler);
    }

    disconnect(): void {
        console.debug(`[Chyrp:${this.name}] 💣 Extension Page Adapter in namespace "${this.namespace}" with UID "${this.uid}" is being disconnected`);
        browser.runtime.onMessage.removeListener(this.handler);
        // browser.runtime.onMessageExternal.removeListener(this.handler);
    }
}