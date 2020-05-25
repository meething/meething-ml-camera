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
import * as paper from "paper";
import "babel-polyfill";

import * as boySVG from "../svg/boy.svg";
import * as girlSVG from "../svg/girl.svg";

export default class PoseEmitter {
  constructor(video,videoWidth,videoHeight,cb) {
    this.video = video ? video : document.getElementById("local");
    // Camera stream video element
    this.videoWidth = videoWidth ? videoWidth : 320;
    this.videoHeight = videoHeight ? videoHeight : 240;

    // Canvas
    this.faceDetection = null;
    this.illustration = null;
    this.canvasScope = paper.default;
    // let canvas = document.querySelector(".illustration-canvas");
    // TODO: use an invisible canvas we return at the end, do not render it
    let canvas = document.createElement('canvas');
    canvas.width = videoWidth ? videoWidth : 320;
    canvas.height = videoHeight ? videoHeight : 240;
    this.canvasScope.setup(canvas);

    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    console.log("Canvas scope = ", this.canvasScope);

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

    this.video.addEventListener("playing", async () => {
      if (!this.loadedModel) {
        await this.loadModels();
      }

      this.video.width = this.videoWidth;
      this.video.height = this.videoHeight;

      var self = this;
      async function poseDetectionFrame() {
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
          //console.log("pose detected : ", all_poses);

          //Dispatch event
          var event = new CustomEvent("poseDetected", {
            detail: {
              faceMesh: self.faceDetection,
              pose: all_poses
            }
          });
          self.video.dispatchEvent(event);

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
          
          if(cb) cb(self.canvasScope.activeLayer);
          
        } catch (err) {
          // input.dispose();
          console.log(err);
        }

        //setTimeout(poseDetectionFrame, 200);
      }

      //poseDetectionFrame();
    });
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
