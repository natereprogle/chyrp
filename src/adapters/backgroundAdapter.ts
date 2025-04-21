/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
import type {Adapter, Context, EventMap, MessageEnvelope} from "../core";
import browser from "webextension-polyfill";
import {isChyrpMessage} from "../utils/chyrp-typeguards";
import uid from "tiny-uid";

export class BackgroundAdapter<Events extends EventMap> implements Adapter<Events> {
    readonly name: Context = "background";
    readonly uid: string;
    readonly namespace: string;
    private callback?: (event: keyof Events, payload: Events[keyof Events]) => void;
    private handler: (msg: any, sender: browser.Runtime.MessageSender) => void;

    constructor(namespace = "chyrp:v1") {
        this.namespace = namespace;
        this.uid = uid(20);

        console.debug(`[Chyrp:${this.name}] 🆕 Background Adapter created in namespace "${this.namespace}" with UID "${this.uid}"`);

        this.handler = (msg: any) => {
            // If the message was sent for a different namespace, or it was sent by this adapter, ignore it
            if (!isChyrpMessage<Events>(msg, this.namespace) || msg.meta.uid === this.uid) return;

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
                meantFor
            },
        };

        // Handles sending messages to background script, popup, and options page
        browser.runtime.sendMessage(envelope).catch((err: Error) => {
            if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
            console.warn(`[Chyrp:${this.name}] ⛔ Background Script in namespace "${this.namespace}" with UID "${this.uid}" failed to send message to runtime`, err);
        });

        // Handles sending messages to content scripts and windows
        void browser.tabs.query({}).then((tabs) => {
            for (const tab of tabs) {
                if (tab.id !== undefined) {
                    browser.tabs.sendMessage(tab.id, envelope).catch((err: Error) => {
                        if (err.message.includes("Could not establish connection. Receiving end does not exist.")) return;
                        console.warn(`[Chyrp:${this.name}] ⛔ Background Script in namespace "${this.namespace}" with UID "${this.uid}" failed`, err);
                    });
                }
            }
        });
    }

    onMessage(callback: (event: keyof Events, payload: Events[keyof Events]) => void): void {
        this.callback = callback;

        browser.runtime.onMessage.addListener(this.handler);
        browser.runtime.onMessageExternal.addListener(this.handler);

        browser.runtime.onSuspend.addListener(() => {
            console.debug(`[Chyrp:${this.name}] ⚠️ Browser requested runtime suspension, gracefully disconnecting`);
            this.disconnect();
        })
    }

    disconnect(): void {
        console.debug(`[Chyrp:${this.name}] 💣 Background Adapter in namespace "${this.namespace}" with UID "${this.uid}" is being disconnected`);
        browser.runtime.onMessage.removeListener(this.handler);
        browser.runtime.onMessageExternal.removeListener(this.handler);
    }
}
