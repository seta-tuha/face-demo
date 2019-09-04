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
  const videoRef = React.useRef();
  const canvasRef = React.useRef();

  const streamRef = React.useRef();
  const imageCaptureRef = React.useRef();

  const [cameraReady, setCameraReady] = React.useState(false);
  const [faceApiReady, setFaceApiReady] = React.useState(false);

  const [images, setImages] = React.useState([]);

  React.useEffect(() => {
    async function initCamera() {
      const stream = await navigator.mediaDevices.getUserMedia(
        { video: { width: 400 } }
      )
      streamRef.current = stream;
      imageCaptureRef.current = new window.ImageCapture(stream.getVideoTracks()[0]);
      setCameraReady(true);
    }
    initCamera();
  }, [])

  React.useEffect(() => {
    async function initFaceApi() {
      await faceApi.loadMtcnnModel('/');
      await faceApi.loadFaceDetectionModel('/');
      setFaceApiReady(true);
    }
    initFaceApi();
  }, [])

  React.useEffect(() => {
    if (faceApiReady && cameraReady) {
      async function trackingFace() {
        const options = getFaceDetectorOptions(faceApi.nets.ssdMobilenetv1)
        const result = await faceApi.detectAllFaces(videoRef.current, options)
        if (result.length > 0) {
          const dims = faceApi.matchDimensions(canvasRef.current, videoRef.current, true)
          faceApi.draw.drawDetections(canvasRef.current, faceApi.resizeResults(result, dims))
          const blob = await imageCaptureRef.current.takePhoto();
          setImages(x => [...x, URL.createObjectURL(blob)]);
        }
        window.requestAnimationFrame(trackingFace);
      }

      videoRef.current.onloadedmetadata = function onPlay() {
        videoRef.current.play();
        trackingFace();
      };

      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady, faceApiReady])

  // React.useEffect(() => {
  //   async function initApp() {
  //     await faceApi.loadMtcnnModel('/');
  //     await faceApi.loadFaceDetectionModel('/');
  //     videoRef.current.srcObject = await navigator.mediaDevices.getUserMedia(
  //       { video: {} }
  //     )
  //   }
  //   async function trackingFace() {
  //     const options = getFaceDetectorOptions(faceApi.nets.ssdMobilenetv1)
  //     const result = await faceApi.detectAllFaces(videoRef.current, options)
  //     if (result) {
  //       const dims = faceApi.matchDimensions(canvasRef.current, videoRef.current, true)
  //       faceApi.draw.drawDetections(canvasRef.current, faceApi.resizeResults(result, dims))
  //     }

  //     window.requestAnimationFrame(trackingFace);
  //   }

  //   videoRef.current.onloadedmetadata = async function onPlay() {
  //     videoRef.current.play();
  //     trackingFace();
  //   };
  //   initApp();
  // }, []);



  return (
    <>
      <div className="App">
        {
          !cameraReady ? 'Init camera' : !faceApiReady ? 'Init face api' : null
        }
        <video ref={videoRef} />
        <canvas ref={canvasRef} />

      </div>
      {
        images.map((imageUrl, index) => (
          <img src={imageUrl} key={index} alt="capture" width={200} />
        ))
      }
    </>
  );
}

export default App;
