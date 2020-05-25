import { monkeyPatchMediaDevices } from "./media-devices.js";
monkeyPatchMediaDevices();

import PoseDetector from "./poseDetection.js";
async function init() {
  const res = await navigator.mediaDevices.enumerateDevices();
  console.log(res);
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: "virtual", width: 320, height: 240 },
    audio: false
  });
  const video = document.createElement("video");
  video.setAttribute("id", "local");
  video.setAttribute("class", "video-local");
  video.srcObject = stream;
  video.autoplay = true;
  document.body.append(video);
  new PoseDetector();
}

init();
