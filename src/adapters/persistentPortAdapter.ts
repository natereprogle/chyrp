import type {Adapter, Context, EventMap, MessageEnvelope} from "../core";
import browser from "webextension-polyfill";
import {isChyrpMessage} from "../utils/chyrp-typeguards";
import uid from 'tiny-uid';

export class PersistentPortAdapter<Events extends EventMap> implements Adapter<Events> {
    name: Context = "persistent-port";
    readonly uid: string;
    readonly namespace: string;
    private callback?: (event: keyof Events, payload: Events[keyof Events]) => void;
    private connectInfo: browser.Runtime.ConnectConnectInfoType;
    private port?: browser.Runtime.Port;
    private retryDelay = 1000;
    private messageQueue: any[] = [];

    constructor(namespace = "chyrp:v1", connectInfo: browser.Runtime.ConnectConnectInfoType = {}) {
        this.namespace = namespace;
        this.uid = uid(20);

        console.debug(`[Chyrp:${this.name}] 🆕 Persistent Port Adapter created in namespace "${this.namespace}" with UID "${this.uid}"`);

        this.connectInfo = connectInfo;
        this.port = browser.runtime.connect(connectInfo);
        this.connect();
    }

    private connect(): void {
        browser.runtime.sendMessage({__chyrp: true, event: "sync"}).catch(() => {
            // This will silently fail if background is down, that's okay
        })

        setTimeout(() => {
            this.port = browser.runtime.connect(this.connectInfo);

            this.port.onMessage.addListener((msg) => {
                console.debug(msg);
                // If the message was sent for a different namespace, or it was sent by this adapter, ignore it
                if (!isChyrpMessage<Events>(msg, this.namespace) || msg.meta.uid === this.uid) return;

                // If the message is not meant for this context, ignore it
                // If the meantFor contains a "*", it means the message is meant for all contexts, so we don't care if it contains this adapter type or not
                if (!msg.meta.meantFor.includes(this.name) && !msg.meta.meantFor.includes("*")) return;

                this.callback?.(msg.event, msg.payload);
            });

            this.port.onDisconnect.addListener(() => {
                console.debug(`[Chyrp:${this.name}] 🔃 Persistent Port Adapter in namespace "${this.namespace}" with UID "${this.uid}" was disconnected, attempting reconnect`);
                this.scheduleReconnect();
            })

            this.flushQueue();
        }, 100);
    }

    private scheduleReconnect(): void {
        setTimeout(() => {
            this.connect()
        }, this.retryDelay);
    }

    private flushQueue(): void {
        if (!this.port) return;

        this.messageQueue.forEach(msg => this.port?.postMessage(msg))

        this.messageQueue = [];
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
            }
        };

        if (this.port) {
            this.port.postMessage(envelope);
        } else {
            this.messageQueue.push(envelope);
        }
    }

    onMessage(callback: (event: keyof Events, payload: Events[keyof Events]) => void): void {
        this.callback = callback;
    }

    disconnect(): void {
        console.debug(`[Chyrp:${this.name}] 💣 Persistent Port Adapter in namespace "${this.namespace}" with UID "${this.uid}" is being disconnected`);
        this.port?.disconnect();
        this.messageQueue = [];
    }
}
