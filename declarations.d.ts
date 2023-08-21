interface GlobalEventHandlersEventMap {
  hostCommand: CustomEvent<ArrayBuffer>;
  hostGameState: CustomEvent<ArrayBuffer>;
}

export declare interface DedicatedWorkerGlobalScope {
  postMessage(message: any, transfer?: Transferable[]): void;
}