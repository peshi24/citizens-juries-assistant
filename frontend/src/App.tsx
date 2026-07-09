import './App.css'
import { useState, useRef } from 'react';

function Recorder() {
  const [status, setStatus] = useState('idle');
  const [audioURL, setAudioURL] = useState(null);      // final recording
  const [previewURL, setPreviewURL] = useState(null);  // in-progress preview

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

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

        streamRef.current.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      console.error('Mic access denied or unavailable:', err);
    }
  };

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;

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
    mediaRecorderRef.current.resume();
    setPreviewURL(null); // clear stale preview while actively recording again
    setStatus('recording');
  };

  const finishRecording = () => {
    mediaRecorderRef.current.stop();
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


function App() { 
  return (
    //main div --------------------------------------------------------------------
    <div className='flex flex-col h-screen'>
      {/*recording div ------------------------------------------------------------------*/}
      <div className='bg-blue-100 h-15 m-4 p-7 pl-4 flex justify-start items-center'>
        {/*recording button*/}
        <Recorder />
      </div>
      {/*big div ------------------------------------------------------------------------*/}
      <div className='flex flex-1 flex-row'>
        {/*transcription div ------------------------------------------------------------*/}
        <div className='bg-blue-100 flex m-4 mt-0 w-[60%]'>
          <p>transcription</p>
        </div>
        {/*panel div---------------------------------------------------------------------*/}
        <div className='bg-blue-100 flex m-4 ml-0 mt-0 w-[40%] flex-col'>
          {/*context div ----------------------------------------------------------------*/}
          <div className='bg-green-100 m-2 h-[35%]'>
            <p>hello</p>
          </div>
          {/*claim bridge div -----------------------------------------------------------*/}
          <div className='bg-yellow-100 m-2 mt-0 h-[40%]'>
            
          </div>
          {/*questions div --------------------------------------------------------------*/}
          <div className='bg-pink-100 m-2 mt-0 h-[25%]'>
            
          </div>
        </div>
      </div>
    </div>

    //sidepanel div ------------------------------------------------------------------------
  );
}

export default App
