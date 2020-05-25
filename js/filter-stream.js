import PoseEmitter from "./poseEmitter.js";
var self = null;
class FilterStream {
  constructor(stream, shader) {
    self = this;
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    //const svg = document.querySelector(".illustration-canvas");
    this.canvas = canvas;
    //this.svg = svg;
    
    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;
    //this.ctx = this.svg.getContext("2d");
    this.outputStream = this.canvas.captureStream();
    this.canvasActiveLayer = null;
    this.poseEmitter = new PoseEmitter(this.video, this.video.videoWidth, this.video.videoHeight, false)
    this.addedCanvas = false;
    video.addEventListener("playing", () => {
      // Use a 2D Canvas.
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.update();
    });
  }

  update() {
    // Use a 2D Canvas
    // this.ctx.filter = 'invert(1)';
    // this.canvas.width = this.video.videoWidth;
    // this.canvas.height = this.video.videoHeight;
    // this.svg.width = this.video.videoWidth;
    // this.svg.height = this.video.videoHeight;
    
    // this.ctx.drawImage(this.video, 0, 0);
    // this.ctx.fillStyle = "#ff00ff";
    // this.ctx.textBaseline = "top";
    // this.ctx.fillText("Virtual", 10, 10);
    this.drawOnCanvas();
    
    requestAnimationFrame(() => this.update());
  }
  
  async drawOnCanvas()
  {
    let svgCanvas = await this.poseEmitter.sampleAndDetect();
    if(svgCanvas instanceof HTMLCanvasElement){
      if(!this.addedCanvas){
        document.body.appendChild(svgCanvas);
        this.addedCanvas = true;
      }
      // console.log("SVG invisible canvas - ", svgCanvas);
      // let svgImage = svgCanvas.getContext("2d").createImageData(svgCanvas.width, svgCanvas.height);
      // this.ctx.drawImage(svgImage, 0, 0);
    // TODO: REPLACE INPUT WITH DRIVER VIDEO AND OUTPUT CANVAS WITH SVG CANVAS
    }
  }
  
}

export { FilterStream };
