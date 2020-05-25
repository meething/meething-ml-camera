import PoseEmitter from "./poseEmitter.js";
var self = null;
class FilterStream {
  constructor(stream, shader) {
    self = this;
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const svg = document.querySelector(".illustration-canvas");
    this.canvas = canvas;
    this.svg = svg;

    video.addEventListener("playing", () => {
      // Use a 2D Canvas.
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.update();
    });
    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;
    this.ctx = this.svg.getContext("2d");
    this.outputStream = this.canvas.captureStream();
    this.canvasActiveLayer = null;
    this.poseEmitter = new PoseEmitter(this.video, this.video.videoWidth, this.video.videoHeight, false)
  }

  update() {
    // Use a 2D Canvas
    // this.ctx.filter = 'invert(1)';
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    
    this.ctx.drawImage(this.video, 0, 0);
    this.ctx.fillStyle = "#ff00ff";
    this.ctx.textBaseline = "top";
    this.ctx.fillText("Virtual", 10, 10);
    let svgCanvas = this.poseEmitter.sampleAndDetect();
    if(svgCanvas instanceof HTMLCanvasElement){
      console.log("SVG invisible canvas - ", svgCanvas);
      //let svgImage = svgCanvas.getContext("2d").createImageData(svgCanvas.width, svgCanvas.height);
      this.ctx.drawImage(svgCanvas, 0, 0);
    // TODO: REPLACE INPUT WITH DRIVER VIDEO AND OUTPUT CANVAS WITH SVG CANVAS
    }
    requestAnimationFrame(() => this.update());
  }
  
  setCanvasActiveLayer(activeLayer)
  {
    self.canvasActiveLayer = activeLayer;
    console.log("Set canvas active layer: ", activeLayer)
  }
  
}

export { FilterStream };
