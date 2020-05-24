import { drawKeypoints, drawPoint, drawSkeleton, isMobile, toggleLoadingUI, setStatusText } from './utils/demoUtils.js';
import { SVGUtils } from './utils/svgUtils.js';
import { PoseIllustration } from './illustrationGen/illustration.js';
import { Skeleton, facePartName2Index } from './illustrationGen/skeleton.js';
import { FileUtils } from './utils/fileUtils.js';
import * as paper from 'paper';

//import * as girlSVG from '../resources/illustration/girl.svg';
import * as boySVG from '../boy.svg';
//import * as abstractSVG from '../resources/illustration/abstract.svg';
//import * as blathersSVG from '../resources/illustration/blathers.svg';
//import * as tomNookSVG from '../resources/illustration/tom-nook.svg';

export default class PoseDetector
  {
    constructor()
    {
      this.video = document.getElementById("local");
        // Camera stream video element
        this.videoWidth = 300;
        this.videoHeight = 300;

        // Canvas
        this.faceDetection = null;
        this.illustration = null;
        this.canvasScope = paper.default;
        let canvas = document.querySelector('.illustration-canvas');
        this.canvasScope.setup(canvas);
        canvas.width = 800;
        canvas.height = 800;
      
        console.log ("Canvas scope = ", this.canvasScope);
        this.canvasWidth = 800;
        this.canvasHeight = 800;

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

        this.defaultPoseNetArchitecture = 'MobileNetV1';
        this.defaultQuantBytes = 2;
        this.defaultMultiplier = 1.0;
        this.defaultStride = 16;
        this.defaultInputResolution = 200;
        
      //Setup SVG
      this.illustration = null;
      this.avatarSvgs = {
        //  'girl': girlSVG.default,
        'boy': boySVG.default,
        //  'abstract': abstractSVG.default,
        //  'blathers': blathersSVG.default,
        //  'tom-nook': tomNookSVG.default,
      };

      this.parseSVG(this.avatarSvgs.boy);
        this.loadModels = async () => {
            this.poseModel = await posenet.load();
            this.faceModel = await facemesh.load();
            this.loadedModel = true;
          console.log("loaded models");
        }
        
        
        this.video.addEventListener('playing', async ()=> {
        if (!this.loadedModel) {
            await this.loadModels();
        }
        
        this.video.width = 300;
        this.video.height = 300;
        // const canvas = document.getElementById('output');
        // const keypointCanvas = document.getElementById('keypoints');
        // //const videoCtx = canvas.getContext('2d');
        // const keypointCtx = keypointCanvas.getContext('2d');

        // canvas.style.width = video.getBoundingClientRect().width + "px";
        // canvas.style.height = video.getBoundingClientRect().height + "px";
        // canvas.style.left = video.getBoundingClientRect().left + "px";
        // canvas.style.top = video.getBoundingClientRect().top + "px";

        var self = this;
        async function poseDetectionFrame() {
            var input;
            try {
                self.video.style.clipPath = "none";  //disable the clipping, to make pose estimation work
                if (self.video.style.width !== self.video.style.height) {
                    self.video.style.width = self.video.style.height;
                }
                const input = tf.browser.fromPixels(self.video);
                // var message = {
                //       input: input,
                //       width: video.width,
                //       height: video.height
                //     };
                //webWorker.postMessage(message, [input]);

                self.faceDetection = await self.faceModel.estimateFaces(input, false, false);
                console.log("Facemesh detected : ", self.faceDetection);
                let poses = [];
                let minPoseConfidence = 0.15;
                let minPartConfidence = 0.1;
                let nmsRadius = 30.0;

                let all_poses = await self.poseModel.estimatePoses(input, {
                    flipHorizontal: true,
                    decodingMethod: 'multi-person',
                    maxDetections: 1,
                    scoreThreshold: self.minPartConfidence,
                    nmsRadius: self.nmsRadius
                });
                 console.log("pose detected : ", all_poses);

                //Dispatch event
                var event = new CustomEvent('poseDetected', {
                    detail: {
                        faceMesh: self.faceDetection,
                        pose: all_poses
                    }
                });
                //console.log("sending event : ", event.detail);
                self.video.dispatchEvent(event);
              
                poses = poses.concat(all_poses);
                input.dispose();
              
                self.canvasScope.project.clear();
              
                if (poses.length >= 1) {
                Skeleton.flipPose(poses[0]);

                if (self.faceDetection && self.faceDetection.length > 0) {
                  let face = Skeleton.toFaceFrame(self.faceDetection[0]);
                  self.illustration.updateSkeleton(poses[0], face);
                } else {
                  self.illustration.updateSkeleton(poses[0], null);
                }
                console.log('draw',self.canvasScope, self.videoWidth, self.videoHeight);
                self.illustration.draw(self.canvasScope, self.videoWidth, self.videoHeight);
                }
                
              if (self.canvasScope.project) {
                self.canvasScope.project.activeLayer.scale(
                  self.canvasWidth / self.videoWidth,
                  self.canvasHeight / self.videoHeight,
                  new self.canvasScope.Point(0, 0)
                );
              } else {
                  // paper project undefined!
                  console.log('ERROR! Paper project undefined',self.canvasScope);
              }
              

            }
            catch (err) {
                // input.dispose();
                console.log(err);
            }

            //requestAnimationFrame(poseDetectionFrame);
            setTimeout(poseDetectionFrame, 1000);
        }

        poseDetectionFrame();

    });
    
    
  }
    
    async parseSVG(target) {
      let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */);
      let skeleton = new Skeleton(svgScope);
      this.illustration = new PoseIllustration(this.canvasScope);
      this.illustration.bindSkeleton(skeleton, svgScope);
  }
  }