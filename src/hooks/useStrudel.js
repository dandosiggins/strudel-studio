import { useState, useRef, useCallback, useEffect } from 'react';
import { webaudioRepl } from '@strudel/webaudio';
import { evalScope } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, getSuperdoughAudioController, registerSynthSounds, registerZZFXSounds } from 'superdough';
// samples is imported here when the TODO above is re-enabled for production
// import { samples } from 'superdough';

registerSynthSounds();
registerZZFXSounds();

const scopeReady = evalScope(
  import('@strudel/core'),
  import('@strudel/mini'),
  import('@strudel/webaudio'),
  import('@strudel/transpiler'),
);

export default function useStrudel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const engineRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // TODO: uncomment for production deployment — CORS blocks strudel.cc from localhost
    // samples('https://strudel.cc/strudel.json')
    //   .then(() => setSamplesLoaded(true))
    //   .catch(() => setSamplesLoaded(true));
    setSamplesLoaded(true);
  }, []);

  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;
    const engine = webaudioRepl({ transpiler });
    engineRef.current = engine;
    return engine;
  }, []);

  const ensureStream = useCallback(() => {
    if (streamRef.current) return streamRef.current;
    const ctx = getAudioContext();
    const controller = getSuperdoughAudioController();
    const mediaDest = ctx.createMediaStreamDestination();
    controller.output.destinationGain.connect(mediaDest);
    streamRef.current = mediaDest.stream;
    return streamRef.current;
  }, []);

  const initAudio = useCallback(async () => {
    await scopeReady;
    const ctx = getAudioContext();
    await ctx.resume();
    ensureStream();
  }, [ensureStream]);

  const play = useCallback(async (code) => {
    setError(null);
    try {
      await scopeReady;
      const ctx = getAudioContext();
      await ctx.resume();
      ensureStream();
      const { evaluate } = ensureEngine();
      await evaluate(code);
      setIsPlaying(true);
    } catch (err) {
      setError(err.message ?? String(err));
      setIsPlaying(false);
    }
  }, [ensureEngine, ensureStream]);

  const stop = useCallback(() => {
    engineRef.current?.scheduler?.stop();
    setIsPlaying(false);
  }, []);

  const getStream = useCallback(() => streamRef.current, []);

  return { play, stop, initAudio, isPlaying, error, samplesLoaded, getStream };
}
