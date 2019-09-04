import React from 'react';
import * as faceApi from 'face-api.js';
import './App.css';
import { getFaceDetectorOptions } from './configuration'

const MAX_IMAGES = 10;

function App() {
  const videoRef = React.useRef();
  const canvasRef = React.useRef();

  const streamRef = React.useRef();
  const imageCaptureRef = React.useRef();
  const captureAnimationFrame = React.useRef();

  const [cameraReady, setCameraReady] = React.useState(false);
  const [faceApiReady, setFaceApiReady] = React.useState(false);
  const [finishCapturing, setFinishCapturing] = React.useState(false);

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
        if (result.length > 0 && videoRef.current) {
          const dims = faceApi.matchDimensions(canvasRef.current, videoRef.current, true)
          faceApi.draw.drawDetections(canvasRef.current, faceApi.resizeResults(result, dims))
          const blob = await imageCaptureRef.current.takePhoto();
          setImages(x => [...x, URL.createObjectURL(blob)]);
        }
        captureAnimationFrame.current = window.requestAnimationFrame(trackingFace);
      }

      videoRef.current.onloadedmetadata = function onPlay() {
        videoRef.current.play();
        trackingFace();
      };

      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady, faceApiReady])

  React.useEffect(() => {
    if (images.length >= MAX_IMAGES) {
      async function stopCapturing() {
        await window.cancelAnimationFrame(captureAnimationFrame.current);
        for (let i = 0; i < streamRef.current.getTracks().length; i++) {
          await streamRef.current.getTracks()[i].stop();
        }
        setFinishCapturing(true);
      }
      stopCapturing();
    }
  }, [images])

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
      {
        !finishCapturing && (
          <div className="App">
            <video ref={videoRef} />
            <canvas ref={canvasRef} />
          </div>
        )
      }
      <div>
        {
          !cameraReady && <div>Init camera</div>}
        {
          !faceApiReady && <div>Init face api</div>
        }
        {
          images.map((imageUrl, index) => (
            <img src={imageUrl} key={index} alt="capture" width={200} />
          ))
        }
      </div>
    </>
  );
}

export default App;
