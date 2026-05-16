import { useState, useRef, useEffect, useCallback } from 'react';
import toWav from 'audiobuffer-to-wav';

export default function useRecorder(getStream) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    const stream = getStream();
    if (!stream) {
      alert('Play a pattern first to enable recording.');
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const webmBlob = new Blob(chunksRef.current, { type: mimeType });
      setIsConverting(true);

      const ts = new Date().toISOString().slice(0, 19);
      const [date, time] = ts.split('T');
      const timestamp = `${date}-${time.replace(/:/g, '')}`;

      try {
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close();

        const wavBuffer = toWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        triggerDownload(wavBlob, `strudel-${timestamp}.wav`);
      } catch (err) {
        console.error('WAV conversion failed, falling back to webm:', err);
        triggerDownload(webmBlob, `strudel-${timestamp}.webm`);
      } finally {
        setIsConverting(false);
      }
    };

    recorder.start(100);
    recorderRef.current = recorder;
    startTimeRef.current = Date.now();
    setRecordingTime(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, [getStream]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  return { isRecording, isConverting, startRecording, stopRecording, recordingTime };
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
