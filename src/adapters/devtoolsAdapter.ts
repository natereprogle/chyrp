import type {EventMap} from "../core";
import {PersistentPortAdapter} from "./persistentPortAdapter";

export class DevtoolsAdapter<Events extends EventMap> extends PersistentPortAdapter<Events> {
    constructor(namespace = "chyrp:v1") {
        super(namespace, {name: `${namespace}-devtools`});
        this.name = "devtools";
    }
}