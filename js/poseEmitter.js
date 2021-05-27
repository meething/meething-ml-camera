import "babel-polyfill";
import * as posenet from '@tensorflow-models/posenet';
import * as facemesh from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs';
import * as paper from "paper";

import {
  drawKeypoints,
  drawPoint,
  drawSkeleton,
  isMobile,
  toggleLoadingUI,
  setStatusText
} from "./utils/demoUtils.js";
import { SVGUtils } from "./utils/svgUtils.js";
import { PoseIllustration } from "./illustrationGen/illustration.js";
import { Skeleton, facePartName2Index } from "./illustrationGen/skeleton.js";
import { FileUtils } from "./utils/fileUtils.js";


import * as boySVG from "../svg/boy.svg";

export default class PoseEmitter {

  constructor(video, videoWidth, videoHeight) {
    this.video = video ? video : document.getElementById("local");
    // Camera stream video element
    this.videoWidth = videoWidth ? videoWidth : 640;
    this.videoHeight = videoHeight ? videoHeight : 480;

    // Canvas
    this.faceDetection = null;
    this.illustration = null;
    this.canvasScope = paper.default;
    // let canvas = document.querySelector(".illustration-canvas");
    // TODO: use an invisible canvas we return at the end, do not render it
    this.canvas = document.createElement('canvas');
    this.canvas.width = videoWidth ? videoWidth : 640;
    this.canvas.height = videoHeight ? videoHeight : 480;
    this.canvasScope.setup(this.canvas);

    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    // console.log("Canvas scope = ", this.canvasScope);


    // ML models
    // let facemesh;
    this.minPoseConfidence = 0.15;
    this.minPartConfidence = 0.1;
    this.nmsRadius = 30.0;
    this.loadedModel = false;
    this.poseModel = null;
    this.faceModel = null;

    // Misc
    this.mobile = false;

    this.defaultPoseNetArchitecture = "MobileNetV1";
    this.defaultQuantBytes = 2;
    this.defaultMultiplier = 1.0;
    this.defaultStride = 16;
    this.defaultInputResolution = 200;

    //Setup SVG
    this.illustration = null;
    this.avatarSvgs = {
      //  'girl': girlSVG.default,
      boy: boySVG.default
    };

    this.parseSVG(this.avatarSvgs.boy);
    this.loadModels = async () => {
      this.poseModel = await posenet.load();
      this.faceModel = await facemesh.load();
      this.loadedModel = true;
      console.log("loaded models");
    };

    this.loadModels();
    this.isRunning = false;
  }

  async sampleAndDetect() {
    var self = this;

    if (!self.loadedModel) {
      return;
    }

    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    self.video.width = self.videoWidth;
    self.video.height = self.videoHeight;


    var input;
    try {
      self.video.style.clipPath = "none"; //disable the clipping, to make pose estimation work
      if (self.video.style.width !== self.video.style.height) {
        self.video.style.width = self.video.style.height;
      }
      const input = tf.browser.fromPixels(self.video);
      self.faceDetection = await self.faceModel.estimateFaces(
        input,
        false,
        false
      );
      //console.log("Facemesh detected : ", self.faceDetection);
      let poses = [];
      let minPoseConfidence = 0.15;
      let minPartConfidence = 0.1;
      let nmsRadius = 30.0;

      let all_poses = await self.poseModel.estimatePoses(input, {
        flipHorizontal: false,
        decodingMethod: "multi-person",
        maxDetections: 1,
        scoreThreshold: self.minPartConfidence,
        nmsRadius: self.nmsRadius
      });
      // console.log("pose detected : ", all_poses);

      poses = poses.concat(all_poses);
      input.dispose();

      self.canvasScope.project.clear();

      if (poses.length >= 1 && self.illustration) {
        Skeleton.flipPose(poses[0]);

        if (self.faceDetection && self.faceDetection.length > 0) {
          let face = Skeleton.toFaceFrame(self.faceDetection[0]);
          self.illustration.updateSkeleton(poses[0], face);
        } else {
          self.illustration.updateSkeleton(poses[0], null);
        }
        self.illustration.draw(
          self.canvasScope,
          self.videoWidth,
          self.videoHeight
        );
      }

      if (self.canvasScope.project) {
        self.canvasScope.project.activeLayer.scale(
          self.canvasWidth / self.videoWidth,
          self.canvasHeight / self.videoHeight,
          new self.canvasScope.Point(50, 200)
        );
      } else {
        // paper project undefined!
        console.log("ERROR! Paper project undefined", self.canvasScope);
      }

    } catch (err) {
      // input.dispose();
      console.log(err);
    }
    this.isRunning = false;
    //return self.canvasScope.project.activeLayer;

    // console.log("pose canvas = ", self.canvas);
    return self.canvas;
  }



  async parseSVG(target) {
    let svgScope = await SVGUtils.importSVG(
      target /* SVG string or file path */
    );
    let skeleton = new Skeleton(svgScope);
    this.illustration = new PoseIllustration(this.canvasScope);
    this.illustration.bindSkeleton(skeleton, svgScope);
  }
}
