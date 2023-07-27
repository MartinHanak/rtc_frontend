import { Application } from "pixi.js";
import { State } from "./State";

export class Context {
    private state: State;
    public app: Application;

    constructor(app : Application, state: State) {
        this.app = app;
        this.transitionTo(state);
    }

    public transitionTo(state: State) {
        this.state = state;
        this.state.setContext(this)
    }

    public render() {
        // render app
        this.state.handleRender();
    }
}