import { Context } from "./Context";

export abstract class State {
    protected context: Context;

    public setContext(context: Context) {
        this.context = context;
    }

    public abstract handleRender(): void;

    public abstract handleCleanup(): void;
}