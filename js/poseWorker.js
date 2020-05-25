import * as posenet from '@tensorflow-models/posenet';
import * as facemesh from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs';

var loadedModels = false;
var poseModel = null;
var faceModel = null;
async function loadModels() {
    poseModel = await posenet.load();
    faceModel = await facemesh.load();
    loadedModels = true;
    console.log("loaded models");
}

loadModels();
var processing = false;

onmessage = async (e) => {
    if (!loadedModels)
        return;
    if (processing)
        return;
    processing = true;

    //console.log("in worker !")

    //console.log(e.data.videoFrame);
    if (e.data.videoFrame !== 'undefined') {
        console.log("Got the frame ! Detecting");
        var frame = e.data.videoFrame;
        var offCanvas = new OffscreenCanvas(e.data.videoWidth, e.data.videoHeight);
        offCanvas.getContext('bitmaprenderer').transferFromImageBitmap(frame);

        var faceDetection = await faceModel.estimateFaces(
            offCanvas,
            false,
            false
        );
        console.log("Facemesh detected : ", faceDetection);
        let poses = [];
        let minPoseConfidence = 0.15;
        let minPartConfidence = 0.1;
        let nmsRadius = 30.0;

        let all_poses = await poseModel.estimatePoses(offCanvas, {
            flipHorizontal: false,
            decodingMethod: "multi-person",
            maxDetections: 1,
            scoreThreshold: minPartConfidence,
            nmsRadius: nmsRadius
        });
        console.log("pose detected : ", all_poses);
        poses = poses.concat(all_poses);
        processing = false;

        var message = {
            poses: poses,
            faceDetection: faceDetection
        };

        postMessage(message);

    }
}