import PoseEmitter from "./poseEmitter.js";
var self = null;
class FilterStream {
  constructor(stream, shader) {
    self = this;
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    this.canvas = canvas;

    this.addedCanvas = false;
    this.svgCanvas;

    video.addEventListener("playing", async () => {
      console.log('video is playing',this.video.videoWidth, this.video.videoHeight);
      // Use a 2D Canvas.
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      if (!this.poseEmitter) this.poseEmitter = new PoseEmitter(this.video, this.video.videoWidth, this.video.videoHeight)
      this.update();
    });

    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;

    this.ctx = this.canvas.getContext("2d");
    this.outputStream = this.canvas.captureStream();

  }

  async update() {
    if(!this.poseEmitter) return;
    // Use a 2D Canvas
    if (this.svgCanvas instanceof HTMLCanvasElement) {
     	this.canvas.width = this.video.videoWidth;
     	this.canvas.height = this.video.videoHeight;
	this.ctx.drawImage(this.svgCanvas, 0, 0, this.video.videoHeight, this.video.videoWidth);
        this.ctx.fillStyle = "#ffff00";
        this.ctx.textBaseline = "top";
        this.ctx.fillText("Virtual Camera", 10, 10);
    } else {
     	this.canvas.width = this.video.videoWidth;
     	this.canvas.height = this.video.videoHeight;
        //this.ctx.drawImage(this.video, 0, 0);
        //this.ctx.fillStyle = "#ff00ff";
        //this.ctx.textBaseline = "top";
        this.ctx.fillText("Loading...", 10, 10);
    }

    this.drawOnCanvas();

    requestAnimationFrame(() => this.update());
  }


  async drawOnCanvas()
  {
    let svgCanvas = await this.poseEmitter.sampleAndDetect();
    if(svgCanvas instanceof HTMLCanvasElement){

      this.svgCanvas = svgCanvas;
      this.svgCanvas.width = this.video.videoWidth;
      this.svgCanvas.height = this.video.videoHeight;
      this.outputStream = this.svgCanvas.captureStream();
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
