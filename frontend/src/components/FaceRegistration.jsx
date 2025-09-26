import React, { useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import * as faceapi from 'face-api.js';

const FaceRegistration = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [front, setFront] = useState(null);
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        // Start camera first with explicit constraints
        const constraints = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Load face-api.js models from reliable source
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          ]);
          setModelsReady(true);
        } catch (e) {
          setError('Unable to load face models. Please check your internet connection.');
        }
      } catch (e) {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
          setError('Camera requires HTTPS or localhost. Use http://localhost during development.');
        } else if (e && e.name === 'NotAllowedError') {
          setError('Camera permission denied. Allow camera access in your browser.');
        } else if (e && e.name === 'NotFoundError') {
          setError('No camera device found.');
        } else {
          setError('Unable to access webcam');
        }
      }
    };
    setup();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  const capture = async (setter) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!modelsReady || !faceapi.nets.tinyFaceDetector.isLoaded || !faceapi.nets.faceRecognitionNet.isLoaded) {
      setError('Models still loading. Please wait...');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    // Run face detection and descriptors
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) {
      setError('No face detected. Please try again.');
      return;
    }
    setter({ image: dataUrl, descriptor: Array.from(detection.descriptor) });
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        front: front?.image,
        left: left?.image,
        right: right?.image,
        frontDescriptor: front?.descriptor,
        leftDescriptor: left?.descriptor,
        rightDescriptor: right?.descriptor,
      };
      await axios.post('/users/me/face-register', payload);
      setSuccess('Face data saved successfully.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save face data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Face Registration</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded bg-black" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 mt-2">
              <button disabled={!modelsReady} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50" onClick={() => capture(setFront)}>Capture Front</button>
              <button disabled={!modelsReady} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50" onClick={() => capture(setLeft)}>Capture Left</button>
              <button disabled={!modelsReady} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50" onClick={() => capture(setRight)}>Capture Right</button>
            </div>
          </div>
          <div className="space-y-3">
            <Preview title="Front" src={front?.image} />
            <Preview title="Left" src={left?.image} />
            <Preview title="Right" src={right?.image} />
          </div>
        </div>
        {error && <div className="text-red-600 mt-4">{error}</div>}
        {success && <div className="text-green-600 mt-4">{success}</div>}
        <div className="mt-4">
          <button disabled={submitting} onClick={onSubmit} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Face Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Preview = ({ title, src }) => (
  <div>
    <div className="text-sm font-medium mb-1">{title}</div>
    {src ? <img src={src} alt={title} className="w-full rounded border" /> : <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">No image</div>}
  </div>
);

export default FaceRegistration;
