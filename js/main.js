import { monkeyPatchMediaDevices } from "./media-devices.js";
monkeyPatchMediaDevices();

async function init() {
  const res = await navigator.mediaDevices.enumerateDevices();
  console.log(res);
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: "virtual" },
    audio: false
  });
}

init();
