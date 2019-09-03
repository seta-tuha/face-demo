import React from 'react';
import * as faceApi from 'face-api.js';
import './App.css';
import { getFaceDetectorOptions } from './configuration'

// var forwardTimes = []

// function updateTimeStats(timeInMs) {
//   forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
//   const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
//   $('#time').val(`${Math.round(avgTimeInMs)} ms`)
//   $('#fps').val(`${faceApi.round(1000 / avgTimeInMs)}`)
// }

function App() {
  const videoRef = React.createRef();
  const canvasRef = React.createRef();
  const mtcnnForwardParams = {
    // limiting the search space to larger faces for webcam detection
    minFaceSize: 200
  }

  React.useEffect(() => {
    async function initApp() {
      await faceApi.loadMtcnnModel('/');
      await faceApi.loadFaceDetectionModel('/');
      navigator.getUserMedia(
        { video: {} },
        stream => {
          videoRef.current.srcObject = stream;
        },
        err => console.error(err)
      )
    }
    videoRef.current.onloadedmetadata = async function onPlay() {
      videoRef.current.play();
      const options = getFaceDetectorOptions(faceApi.nets.ssdMobilenetv1)
      const ts = Date.now()
      const result = await faceApi.detectAllFaces(videoRef.current, options)
      console.log(result);
      if (result) {
        const dims = faceApi.matchDimensions(canvasRef.current, videoRef.current, true)
        faceApi.draw.drawDetections(canvasRef.current, faceApi.resizeResults(result, dims))
      }
      setTimeout(() => onPlay())
    };
    // videoRef.current.onPlay = async function onPlay() {

    // }
    initApp();
  }, []);



  return (
    <div className="App">
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
