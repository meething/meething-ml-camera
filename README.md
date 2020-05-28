<img src="https://i.imgur.com/XS79fTC.png" width=200> <img width="100" alt="mozilla-builders" src="https://user-images.githubusercontent.com/1423657/81992335-85346480-9643-11ea-8754-8275e98e06bc.png">

### Meething : Machine-Learning Camera
Machine-Learning powered Virtual MediaDevice extension for any browser-based conferencing service.

![ezgif com-optimize (66)](https://user-images.githubusercontent.com/1423657/83061179-de958e00-a05c-11ea-844f-141f55d4e092.gif)

Behind the scenes, the actual camera frames are being processed by PoseNet and FaceMesh producing coordinates used to animate an [SVG Character](https://github.com/yemount/pose-animator) which replaces the camera output, never streaming your real image. 

#### Usage
To test the model without installing any extension, run the following or use glitch:
```
npm install
npm run build
npm start
```

#### Usage as Extension (alpha)
Nothing to compile if you want to use the extension - Follow the instructions to install in your preferred browser:

##### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Chromium_Material_Icon.png/64px-Chromium_Material_Icon.png" width=20> Chromium
* download or clone the repo
* go to chrome://extensions
* enable Developer Mode
* Load unpacked
* Browse to the `dist` folder with the extension (where the `manifest.json` file is)


##### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/68px-Firefox_logo%2C_2019.svg.png" width=20> Firefox 
* download or clone the repo
* go to about:debugging#/runtime/this-firefox
* Click "Load Temporary Add-on..."
* Browse to the `dist` folder with the extension and select the `manifest.json` file

#### Usage without Extension
If you want to use this without extension, try our decentralized conference project [Meething](https://github.com/meething/meething)

#### Credits
This humble _hack-speriment_ would not be possible without the following projects:
* [Virtual Browser Camera shaders](https://github.com/spite/virtual-webcam) by [spite](https://github.com/spite)
* [Pose Animator](https://github.com/yemount/pose-animator) by [yemount](https://github.com/yemount)
* [Meething](https://us.meething.space) by [Team Meething](https://github.com/meething/meething/graphs/contributors)
