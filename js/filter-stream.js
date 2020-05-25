class FilterStream {
  constructor(stream, shader) {
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    this.canvas = canvas;

    video.addEventListener("playing", () => {
      // Use a 2D Canvas.
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.update();
    });
    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;
    this.ctx = this.canvas.getContext('2d');
    
    this.outputStream = this.canvas.captureStream();
  }

  update() {
    // Use a 2D Canvas
    // this.ctx.filter = 'invert(1)';
    this.ctx.drawImage(this.video, 0, 0);
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Virtual', 10, 10)

    requestAnimationFrame(() => this.update());
  }
}

export { FilterStream }