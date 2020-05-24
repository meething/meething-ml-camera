import { drawKeypoints, drawPoint, drawSkeleton, isMobile, toggleLoadingUI, setStatusText } from './utils/demoUtils.js';
import { SVGUtils } from './utils/svgUtils.js';
import { PoseIllustration } from './illustrationGen/illustration.js';
import { Skeleton, facePartName2Index } from './illustrationGen/skeleton.js';
import { FileUtils } from './utils/fileUtils.js';
import * as paper from 'paper';

//import * as girlSVG from '../resources/illustration/girl.svg';
//import * as boySVG from '../boy.svg';
//import * as abstractSVG from '../resources/illustration/abstract.svg';
//import * as blathersSVG from '../resources/illustration/blathers.svg';
//import * as tomNookSVG from '../resources/illustration/tom-nook.svg';
const vs = `
  attribute vec4 a_position;

  void main() {
    gl_Position = a_position;
  }
`;

const fs = `
precision highp float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;
uniform float iTime;

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    vec4 cam = texture2D(iChannel0, uv);
    gl_FragColor = vec4(cam.r, uv, 1.);
  }
`;

function wrapShaderToy(source) {
  return `

precision highp float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;
uniform float iTime;

${source}

void main() {
  vec4 col;
  mainImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
`;
}

class ShaderRenderer {
  constructor(canvas, video, shader) {

    this.canvas = canvas;
    this.video = video;

    var self = this;
    self.video.onplay = async () => {
      //Setup illustration canvas
      self.illustrationCanvas = document.createElement('canvas');
      self.canvasWidth = 800;
      self.canvasHeight = 800;
      self.illustrationCanvas.width = self.canvasWidth;
      self.illustrationCanvas.height = self.canvasHeight;
      self.canvasScope = paper.default;
      self.canvasScope.setup(self.illustrationCanvas);

      //Setup SVG
      self.illustration = null;
      // self.avatarSvgs = {
      //   //  'girl': girlSVG.default,
      //   'boy': boySVG.default,
      //   //  'abstract': abstractSVG.default,
      //   //  'blathers': blathersSVG.default,
      //   //  'tom-nook': tomNookSVG.default,
      // };

      self.parseSVG('../boy.svg');

      //MODEL
      self.loadedModel = false;
      //Start Detection
      self.detectPoseInRealTime();
    }

    this.gl = this.canvas.getContext("webgl");
    //this.gl.getExtension('EXT_shader_texture_lod');

    this.program = this.createProgram(vs, wrapShaderToy(shader));

    this.texture = this.gl.createTexture();

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), this.gl.STATIC_DRAW);
    this.resolutionLocation = this.gl.getUniformLocation(this.program, "iResolution");
    this.cameraLocation = this.gl.getUniformLocation(this.program, 'iChannel0');
    this.timeLocation = this.gl.getUniformLocation(this.program, "iTime");
  }

  createShader(sourceCode, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, sourceCode);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      var info = this.gl.getShaderInfoLog(shader);
      console.log(info);
      debugger;
      throw 'Could not compile WebGL program. \n\n' + info;
    }
    return shader;
  }

  createProgram(vertexShaderSource, fragmentShaderSource) {
    const vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    var program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    var success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.log(this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
  }

  setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  render() {
    //this.gl.clearColor(255, 0, 255, 1);
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
    if (this.timeLocation) {
      this.gl.uniform1f(this.timeLocation, .001 * performance.now());
    }

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.cameraLocation, 0);

    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  detectPoseInRealTime() {

    const canvas = this.canvas;
    //const keypointCanvas = document.getElementById('keypoints');
    const videoCtx = canvas.getContext('2d');
    //const keypointCtx = keypointCanvas.getContext('2d');

    var videoWidth = 300;
    var videoHeight = 300;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    //keypointCanvas.width = videoWidth;
    //keypointCanvas.height = videoHeight;

    async function poseDetectionFrame() {
      // Begin monitoring code for frames per second
      //stats.begin();

      let poses = [];
      let minPoseConfidence = 0.15;
      let minPartConfidence = 0.1;
      let nmsRadius = 30.0;
      // videoCtx.clearRect(0, 0, videoWidth, videoHeight);
      // // Draw video
      // videoCtx.save();
      // videoCtx.scale(-1, 1);
      // videoCtx.translate(-videoWidth, 0);
      // videoCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
      // videoCtx.restore();

      // Creates a tensor from an image
      const input = tf.browser.fromPixels(this.video);
      var faceDetection = await facemesh.estimateFaces(input, false, false);
      let all_poses = await posenet.estimatePoses(this.video, {
        flipHorizontal: true,
        decodingMethod: 'multi-person',
        maxDetections: 1,
        scoreThreshold: minPartConfidence,
        nmsRadius: nmsRadius
      });
      console.log("Pose : ", all_poses);

      poses = poses.concat(all_poses);
      input.dispose();

      // keypointCtx.clearRect(0, 0, videoWidth, videoHeight);
      // if (guiState.debug.showDetectionDebug) {
      //   poses.forEach(({score, keypoints}) => {
      //   if (score >= minPoseConfidence) {
      //       drawKeypoints(keypoints, minPartConfidence, keypointCtx);
      //       drawSkeleton(keypoints, minPartConfidence, keypointCtx);
      //     }
      //   });
      //   faceDetection.forEach(face => {
      //     Object.values(facePartName2Index).forEach(index => {
      //         let p = face.scaledMesh[index];
      //         drawPoint(keypointCtx, p[1], p[0], 2, 'red');
      //     });
      //   });
      // }

      // canvasScope.project.clear();

      if (poses.length >= 1) {
        Skeleton.flipPose(poses[0]);

        if (faceDetection && faceDetection.length > 0) {
          let face = Skeleton.toFaceFrame(faceDetection[0]);
          this.illustration.updateSkeleton(poses[0], face);
        } else {
          this.illustration.updateSkeleton(poses[0], null);
        }
        this.illustration.draw(this.canvasScope, videoWidth, videoHeight);

        // if (guiState.debug.showIllustrationDebug) {
        //   illustration.debugDraw(canvasScope);
        // }
      }

      this.canvasScope.project.activeLayer.scale(
        this.canvasWidth / videoWidth,
        this.canvasHeight / videoHeight,
        new this.canvasScope.Point(0, 0));

      // End monitoring code for frames per second
      // stats.end();

      requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
  }

  async loadModels() {
    this.posenet = await posenet.load();
    this.faceModel = await facemesh.load();
    this.loadedModel = true;
  }
  async parseSVG(target) {
    let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */);
    let skeleton = new Skeleton(svgScope);
    this.illustration = new PoseIllustration(this.canvasScope);
    this.illustration.bindSkeleton(skeleton, svgScope);
  }
}

export { ShaderRenderer }