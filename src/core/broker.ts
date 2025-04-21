import {PubSub} from "./pubsub";
import {Adapter, Context, EventMap, PageContext} from "./types";
import {BackgroundAdapter} from "../adapters/backgroundAdapter";
import browser from "webextension-polyfill";
import {
    ContentScriptAdapter,
    DevtoolsAdapter,
    ExtensionPageAdapter,
    PageScriptAdapter,
    PersistentPortAdapter
} from "../adapters";

/**
 * The Broker is the main entry point for the Chyrp library.
 * It is responsible for managing the adapters and handling the communication between them.
 *
 * Messages are "published" to the broker, which calls the `send()` method on each adapter,
 * who in turn handle actually sending the message according to whatever logic is necessary
 *
 * Adapters register their own message receivers, and once messages are received,
 * they publish them to the other brokers who in turn forwards it to all other adapters
 */
export class Broker<Events extends EventMap> {
    private pubsub: PubSub<Events>;
    private adapters: Adapter<Events>[] = [];
    private locked = false;

    /**
     * Creates a new Broker instance
     * Brokers are namespace agnostic, the adapters are responsible for handling namespaces
     */
    constructor() {
        this.pubsub = new PubSub<Events>();
    }

    /**
     * Subscribes to an event
     * @param event The event to subscribe to
     * @param callback The function called when the event is published, which includes the payload
     * @param contexts The contexts this subscription will listen to. Set to ["*"] to subscribe to all contexts
     */
    subscribe<K extends keyof Events>(event: K, callback: (payload: Events[K]) => void, contexts: Context[] = ["*"]): () => void {
        return this.pubsub.subscribe(event, contexts, callback);
    }

    /**
     * Subscribes to an event
     * @param event The event to subscribe to
     * @param callback The function called when the event is published, which includes the payload
     */

    /**
     * Publishes a new event to the Broker. Adapters will handle the actual sending of the message
     * @param event The event to publish
     * @param payload The payload to send with the event
     * @param meantForContexts The contexts this message is meant for. If not specified, the message will be sent to all contexts
     */
    publish<K extends keyof Events>(event: K, payload: Events[K], meantForContexts: Context[] = ["*"]) {
        this.pubsub.publish(event, payload, meantForContexts);

        this.adapters.forEach(adapter => {
            adapter.send(event, payload, meantForContexts);
        })
    }

    /**
     * Destroys the broker and all adapters. This will cause each adapter to immediately disconnect
     */
    destroy() {
        this.adapters.forEach(adapter => {
            adapter.disconnect?.()
        })
        this.adapters = [];
    }

    /**
     * Registers an adapter with the broker
     *
     * Only one adapter per context per namespace can be registered
     * @param adapter The adapter to register
     * @private
     */
    private withAdapter(adapter: Adapter<Events>): this {
        if (this.locked) {
            throw new Error("Cannot register adapters after withPageScriptAdapter has been called");
        }

        if (this.adapters.some(adptr => adptr.name === adapter.name && adptr.namespace === adapter.namespace)) {
            throw new Error("Only one adapter per context per namespace can be registered");
        }

        this.adapters.push(adapter);
        adapter.onMessage((event, payload) => {
            this.pubsub.publish(event, payload, [adapter.name]);
        });

        return this;
    }

    /**
     * Creates a new BackgroundAdapter and registers it with the broker
     * @param namespace The namespace this adapter will use
     * @throws {Error} If an adapter with the same name and namespace already exists
     */
    withBackgroundAdapter(namespace = "chyrp:v1"): this {
        return this.withAdapter(new BackgroundAdapter<Events>(namespace));
    }

    /**
     * Create a new PersistentPortAdapter and registers it with the broker
     * @param connectInfo The connection info for the port
     * @param namespace The namespace this adapter will use
     * @throws {Error} If an adapter with the same name and namespace already exists
     */
    withPersistentPortAdapter(connectInfo: browser.Runtime.ConnectConnectInfoType = {name: "chyrp-port"}, namespace = "chyrp:v1"): this {
        return this.withAdapter(new PersistentPortAdapter<Events>(namespace, connectInfo));
    }

    /**
     * Creates a new ExtensionPageAdapter and registers it with the broker.
     * This adapter is used to enable communication to/from the extension's pages (popup, options, etc.)
     * @param namespace The namespace this adapter will use
     * @param name The name of the page context (popup, options, etc.)
     * @throws {Error} If an adapter with the same name and namespace already exists
     */
    withExtensionPageAdapter(namespace = "chyrp:v1", name: PageContext): this {
        return this
            .withAdapter(new ExtensionPageAdapter(namespace, name));
    }

    /**
     * Creates a new DevtoolsAdapter and registers it with the broker.
     * This simply wraps the PersistentPortAdapter, but with a different name to help differentiate it from the port adapters.
     * @param namespace The namespace this adapter will use
     * @throws {Error} If an adapter with the same name and namespace already exists
     */
    withDevtoolsAdapter(namespace = "chyrp:v1"): this {
        return this.withAdapter(new DevtoolsAdapter<Events>(namespace));
    }

    /**
     * Creates a new PageScriptAdapter and registers it with the broker.
     * This adapter is used to enable communication to/from content scripts injected directly into the MAIN world (i.e. { frameId: 0 })
     *
     * Because page scripts cannot receive messages, it instead uses window.onMessage and window.postMessage.
     * To achieve this, when injecting a PageScriptAdapter, a ContentScriptAdapter is, by default, automatically injected as a "proxy".
     * This behavior can be changed by setting `injectContentAdapter` to false.
     *
     * Lastly, because page scripts cannot use `browser.runtime`, using this method blocks further adapter registration and removes any previously registered adapters.
     *
     * @param namespace The namespace this adapter will use
     * @param injectContentAdapter If true, a ContentScriptAdapter will be automatically injected as a proxy for the PageScriptAdapter. Defaults to true.
     *
     * @throws {Error} If an adapter with the same name and namespace already exists
     */
    withPageScriptAdapter(namespace = "chyrp:v1", injectContentAdapter = true): this {
        this.adapters.length = 0;
        let broker = this
            .withAdapter(new PageScriptAdapter<Events>(namespace));

        if (injectContentAdapter) broker = broker.withAdapter(new ContentScriptAdapter(namespace));

        this.locked = true;
        return broker;
    }

    /**
     * Creates a new ContentScriptAdapter and registers it with the broker
     * This adapter is used to enable communication to/from content scripts injected into the ISOLATED world (I.e. "regular" content scripts)
     * This cannot be called if withPageScriptAdapter has already been called, as that will automatically inject a ContentScriptAdapter
     * @param namespace
     */
    withContentScriptAdapter(namespace = "chyrp:v1"): this {
        return this.withAdapter(new ContentScriptAdapter<Events>(namespace));
    }
}