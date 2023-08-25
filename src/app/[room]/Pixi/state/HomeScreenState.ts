import { Container, Point, Text, Assets, Sprite, Texture } from "pixi.js";
import { State } from "./State";
import { LoadingState } from "./LoadingState";

import BodyImage from '../../../../../public/images/body.png';
import EyesImage from '../../../../../public/images/eyes.png';
import BodyBackgroundImage from '../../../../../public/images/body_background.png';

 

export class HomeScreenState extends State {
    public handleRender() {
        // reset stage and ticker

        const heading = new Text("Home");
        heading.x = 0;
        heading.y = 0;

        const next = new Text("Next");
        next.anchor.set(1,0);
        next.x = this.context.app.screen.width;
        next.y = 0;
        

        // click
        next.eventMode = 'static';
        next.cursor = 'pointer';
        next.on('pointerdown', () => {
            this.context.transitionTo(new LoadingState())
            console.log('hello');
        });

        this.context.app.stage.addChild(heading);
        this.context.app.stage.addChild(next);



        // character creation
        const container = new Container();
        container.x = 200;
        container.y = 200;

        const body = Texture.fromURL(BodyImage.src);
        const eyes = Texture.fromURL(EyesImage.src);
        const bodyBackground = Texture.fromURL(BodyBackgroundImage.src)

        const textures = Promise.all([body, eyes, bodyBackground]);

        textures
        .then((results) => {
            
            const bodySprite = new Sprite(results[0]);
            const eyesSprite = new Sprite(results[1]);
            const backgroundSprite = new Sprite(results[2]);


            container.addChild(backgroundSprite);
            container.addChild(bodySprite);
            container.addChild(eyesSprite);
            

        })
        .catch((err) => console.log(err))

        this.context.app.stage.addChild(container);

        // download
        const downloadText = new Text("Download Image");
        downloadText.eventMode = 'static';
        downloadText.cursor = 'pointer';
        downloadText.x = container.x + container.width/2;
        downloadText.y = container.y + container.getBounds().height

        downloadText.on('pointerdown', () => {
            console.log('Downloading image');
            const tempCanvas = this.context.app.renderer.extract.canvas(container);
            if(tempCanvas) {
                tempCanvas.toBlob!((blob: Blob | null) => {
                    if(!blob) {
                        return;
                    }
                    // Create a downloadable URL for the Blob
                    const url = URL.createObjectURL(blob);

                    // Create an anchor element to trigger the download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.download = 'canvas_capture.png';
                    downloadLink.innerHTML = 'Download Image';

                    // Append the link to the document
                    document.body.appendChild(downloadLink);

                    // Simulate a click event on the download link to trigger the download
                    downloadLink.click();

                    // Clean up by revoking the object URL
                    URL.revokeObjectURL(url);

                }, 'image/png');
            }
        })
        this.context.app.stage.addChild(downloadText);


    }

    public handleCleanup(): void {
        this.context.app.stage.removeChildren()
    }
}