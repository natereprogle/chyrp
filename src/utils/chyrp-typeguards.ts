/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {EventMap, MessageEnvelope} from "../core";

export function isChyrpMessage<Events extends EventMap>(
    msg: any,
    namespace: string
): msg is MessageEnvelope<keyof Events, Events> {
    return (
        typeof msg === "object" &&
        msg !== null &&
        msg.__chyrp === true &&
        typeof msg.event === "string" &&
        msg.meta?.namespace === namespace
    );
}
