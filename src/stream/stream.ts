import type {EventMap, Broker} from "../core";

export interface ChyrpMessage<K extends keyof any = string, V = unknown> {
    event: K;
    payload: V;
}

export function messageStream<Events extends EventMap>(
    broker: Broker<Events>,
    events: (keyof Events)[]
): ReadableStream<ChyrpMessage<keyof Events, Events[keyof Events]>> {
    return new ReadableStream({
        start(controller) {
            const unsubscribers = events.map((event) =>
                broker.subscribe(event, (payload) => {
                    controller.enqueue({event, payload});
                })
            );

            this.cancel = () => {
                unsubscribers.forEach((fn) => {
                    fn()
                })
            }
        },

        cancel() {
            // This will be replaced in start()
        }
    });
}
