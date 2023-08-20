export class HighResolutionTimer {
    private totalTicks = 0;
    private timer: number | undefined;
    private startTime: number | undefined;
    private currentTime: number | undefined;
    private deltaTime = 0;

    constructor(public duration: number, public callback: (timer: HighResolutionTimer) => void) {
    }

    run() {
        let lastTime = this.currentTime;
        this.currentTime = Date.now();

        if (!this.startTime) {
            this.startTime = this.currentTime;
        }
        if (lastTime !== undefined) {
            this.deltaTime = (this.currentTime - lastTime);
        }

        this.callback(this);

        let nextTick = this.duration - (this.currentTime - (this.startTime + (this.totalTicks * this.duration)));
        this.totalTicks++;

        this.timer = self.setTimeout(() => {
            this.run();
        }, nextTick);
    }

    stop() {
        if (this.timer !== undefined) {
            self.clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
}