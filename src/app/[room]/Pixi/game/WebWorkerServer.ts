// 
//  Web Worker file
//
self.onmessage = (e: MessageEvent<string>) => {
    console.log(e);
    postMessage('heello from web worker')
}