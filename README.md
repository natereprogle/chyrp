<div style="text-align: center">
<img src="./assets/banner.png" alt="Logo">
</div>

# What is Chyrp?

Chyrp (Pronounced "Chirp") is a web extension library which wraps messaging APIs,
making it drop-dead easy to send messages between extension contexts.

There are dozens of libraries out there that do this, but they are either outdated or
complicated. Chyrp is simple, modern, and easy to use.

Chyrp revolves around the concept of "brokers". A broker is an object that registers
adapters, which handle communications between contexts. Here's an example:

```typescript
import {Broker} from "../../chyrp/src";

// Events are defined as a Record of event names to their payloads
// Thanks to TypeScript, Chyrp ensures type safety for your events!
interface ChyrpEvents {
    "hello": { who: string };
    "reply": { msg: string, luckyNumber: number };
}

//                                                 👇🏻 Magic happens with adapters!
const broker = new Broker<ChyrpEvents>().withContentScriptAdapter();

console.log("🔥 Subscribing to \"hello\" event");
broker.subscribe("hello", (event) => {
    console.log("Received a hello event!", event);
    broker.publish("reply", { msg: "Reply from hello event subscriber!", luckyNumber: 13 });
});

console.log("🔥 Subscribing to \"reply\" event");
broker.subscribe("reply", (event) => {
    console.log("Received a reply event!");
    console.log(event);
});
```

You'll notice we aren't explicitly making any calls to `browser.runtime.onMessage`, `onMessageExternal`, or anything
like that.
Quite frankly, _who cares_ how the messages are sent or received? Chyrp abstracts that away for you, which is the beauty
of it!

Subscriptions can be created so they only listen to messages from certain contexts, and a Broker can have multiple
adapters (Although this is not recommended!). As well, messages can be published to only specific contexts

```typescript
// Subscribe to messages from the content script only
broker.subscribe("hello", (event) => {
    console.log("Received a hello event from a content script!", event);
}, ["content-script"]);

// Publish a message to the content script only
broker.publish(
    "hello",
    { msg: "This should only be received by subscribers listening to the '*' or 'content-script' contexts" },
    ["content-script"]
);
```

# Installation

Chyrp is available on npm, so you can install it with your favorite package manager:

```bash
npm install chyrp
# or
yarn add chyrp
# or
pnpm add chyrp
```