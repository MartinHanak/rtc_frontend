import { Application } from "pixi.js";
import { State } from "./State";
import { PixiApp } from "../PixiApp";

export class Context {
    private state: State;
    public app: Application;
    public appWrapper: PixiApp;

    constructor(appWrapper: PixiApp,  app : Application, state: State) {
        this.appWrapper = appWrapper;
        this.app = app;
        this.transitionTo(state);
    }

    public transitionTo(state: State) {
        if(this.state) {
            // run cleanup of the old state
            this.state.handleCleanup();
        }
        this.state = state;
        this.state.setContext(this);
        this.render();
    }

    public render() {
        // clean-up previous state
        this.state.handleCleanup();
        // render app
        this.state.handleRender();
    }
}