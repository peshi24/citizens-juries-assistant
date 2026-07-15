
//to make a recorder
//you need to use useStates to make the different dev setups
//record audio in a blob file
//animations come last and so does time

import {useState, useRef} from 'react';
// suppress missing declaration file for the jsx animation module
// @ts-ignore
import Waveform from './animations/waveform.jsx'

//recorder function

function Recorder() {

    //usestates
    const [status, setStatus] = useState('idle');

    //final recording state
    const [audioURL, setAudioURL] = useState<string | null>(null); 
    
    //preview recording state
    const [previewURL, setPreviewURL] = useState<string | null>(null);  

    //references
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setPreviewURL(null);
      setAudioURL(null);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setPreviewURL(null);

        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      console.error('Mic access denied or unavailable:', err);
    }
  };

    const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // Flush whatever's been recorded so far into chunksRef,
    // THEN build a preview blob once that data arrives.
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setPreviewURL(URL.createObjectURL(blob));

      // restore the normal handler for future chunks
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
    };

    recorder.requestData(); // triggers ondataavailable immediately
    recorder.pause();
    setStatus('paused');
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    setPreviewURL(null); // clear stale preview while actively recording again
    setStatus('recording');
  };

  const finishRecording = () => {
    mediaRecorderRef.current?.stop();
    setStatus('idle');
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex gap-2">
        {status === 'idle' && (
          <button onClick={startRecording} className="px-4 py-2 rounded bg-blue-500 text-white">
            Start Recording
          </button>
        )}

        {status === 'recording' && (
          <>
            <button onClick={pauseRecording} className="px-4 py-2 rounded bg-yellow-500 text-white">
              Pause
            </button>
            <button onClick={finishRecording} className="px-4 py-2 rounded bg-red-500 text-white">
              Finish
            </button>
            <Waveform stream = {streamRef.current}/>
          </>
        )}

        {status === 'paused' && (
          <>
            <button onClick={resumeRecording} className="px-4 py-2 rounded bg-green-500 text-white">
              Resume
            </button>
            <button onClick={finishRecording} className="px-4 py-2 rounded bg-red-500 text-white">
              Finish
            </button>
          </>
        )}
      </div>

      {status === 'paused' && previewURL && (
        <div className="flex flex-col items-center gap-1">
          <audio controls src={previewURL} />
        </div>
      )}

      {audioURL && (
        <div className="flex flex-col items-center gap-1">
          <audio controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default Recorder;