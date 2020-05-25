<img src="https://i.imgur.com/XS79fTC.png" width=200> <img width="100" alt="mozilla-builders" src="https://user-images.githubusercontent.com/1423657/81992335-85346480-9643-11ea-8754-8275e98e06bc.png">

### Meething : Machine-Learning Camera
Machine-Learning powered Virtual MediaDevice extension for any browser-based conferencing service.

![image](https://user-images.githubusercontent.com/1423657/82818656-561dbe80-9e9f-11ea-90a1-5436fdcb84e5.png)

Behind the scenes, the actual camera frames are being processed by PoseNet and FaceMesh producing coordinates used to animate an [SVG Character](https://github.com/yemount/pose-animator) which replaces the camera output, never streaming your real image. 

#### Usage
Follow the instructions to install as an extension in your preferred browser:


##### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Chromium_Material_Icon.png/64px-Chromium_Material_Icon.png" width=50> Chromium
* download or clone the repo
* go to chrome://extensions
* enable Developer Mode
* Load unpacked
* Browse to the folder with the extension (where the manifest.json is)


##### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/68px-Firefox_logo%2C_2019.svg.png" width=50> Firefox 
* download or clone the repo
* go to about:debugging#/runtime/this-firefox
* Click "Load Temporary Add-on..."
* Browse to the folder with the extension and select the manifest.json


#### Credits
* [Virtual Browser Camera shaders](https://github.com/spite/virtual-webcam) by [spite](https://github.com/spite)
* [Pose Animator](https://github.com/yemount/pose-animator) by [yemount](https://github.com/yemount)
