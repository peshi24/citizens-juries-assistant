//import modules from react for the different states
import { useEffect, useRef, useState } from "react";

interface RecorderProps {
  onResults?: (results: any) => void;
  onProcessing?: (loading: boolean) => void;
}

function Recorder({ onResults, onProcessing }: RecorderProps) {

  // Track the current recording state: idle, recording, or paused.
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  // Store the current audio file URL so the player can load it.
  const [audioURL, setAudioURL] = useState<string | null>(null);
  // Store the current recording filename returned by the backend.
  const [filename, setFilename] = useState<string | null>(null);
  // Reference to the audio element so its source can be updated programmatically.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Keep a timer reference so the backend status is polled while recording.
  const statusTimerRef = useRef<number | null>(null);

  // Base URL for the backend recording API: python port
  const API = "http://127.0.0.1:8000";

  // Stop any active backend polling interval when recording is paused or finished.
  const clearStatusTimer = () => {
    if (statusTimerRef.current !== null) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  // Build and set the audio URL for the current recording file.
  const updateAudioSource = (nextFilename: string | null) => {
    if (!nextFilename) {
      setAudioURL(null);
      return;
    }

    const nextUrl = `${API}/recordings/${nextFilename}?t=${Date.now()}`;
    setAudioURL(nextUrl);

    if (audioRef.current) {
      audioRef.current.src = nextUrl;
      audioRef.current.load();
    }
  };

  // Ask the backend to start a new recording session and begin polling live status.
  const startRecording = async () => {
    try {
      const response = await fetch(`${API}/start`, {
        method: "POST",
      });

      const data = await response.json();

      console.log(data);

      setFilename(data.filename ?? null);
      updateAudioSource(data.filename ?? null);
      setStatus("recording");

      // Poll backend recording status and live transcription while recording.
      clearStatusTimer();
      statusTimerRef.current = window.setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API}/status`);
          const statusData = await statusResponse.json();

          if (statusData.filename) {
            setFilename(statusData.filename);
            updateAudioSource(statusData.filename);
          }

          if (statusData.transcription || statusData.diarization) {
            onResults?.({
              transcription: statusData.transcription,
              diarization: statusData.diarization,
            });
          }
        } catch (statusErr) {
          console.error("Status poll failed", statusErr);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  // Pause the active recording and keep the latest audio file available.
  const pauseRecording = async () => {
    try {
      const response = await fetch(`${API}/pause`, {
        method: "POST",
      });

      const data = await response.json();

      console.log(data);

      if (data.filename) {
        setFilename(data.filename);
        updateAudioSource(data.filename);
      }

      setStatus("paused");
    } catch (err) {
      console.error(err);
    }
  };

  // Resume a paused recording session.
  const resumeRecording = async () => {
    try {
      const response = await fetch(`${API}/resume`, {
        method: "POST",
      });

      const data = await response.json();

      console.log(data);

      setFilename(null);

      setStatus("recording");
    } catch (err) {
      console.error(err);
    }
  };

  // Stop the recording, save the final audio file, and send final transcription/diarization results.
  const finishRecording = async () => {
    try {
      onProcessing?.(true);
      const response = await fetch(`${API}/stop`, {
        method: "POST",
      });

      const data = await response.json();

      console.log(data);

      if (data.saved_to) {
        const savedFilename = data.saved_to.split("/").pop();
        setFilename(savedFilename ?? null);
        updateAudioSource(savedFilename ?? null);
      }

      if (data.results) {
        onResults?.(data.results);
      }

      clearStatusTimer();
      setStatus("idle");
    } catch (err) {
      console.error(err);
    } finally {
      onProcessing?.(false);
    }
  };

  // Clean up polling when the component unmounts.
  useEffect(() => {
    return () => {
      clearStatusTimer();
    };
  }, []);

  // debug command to ensure the right audio url is being displayed (check console log) 
  console.log("Audio URL being displayed:", audioURL);

  //frontend design
  return (

    //main div
    <div className="flex flex-row items-center gap-4">
      <div className="flex gap-3">

        {/*start button*/}
        {status === "idle" && (
          <button
            onClick={startRecording}
            className="bg-blue-500 px-4 py-2 rounded-sm hover:bg-blue-600 text-white text-sm cursor-pointer"
          >
            start 
          </button>
        )}

        {/*pause button*/}
        {status === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="px-4 py-2 rounded-sm bg-yellow-500 hover:bg-yellow-600 text-white text-sm cursor-pointer"
            >
              pause
            </button>

            <button
              onClick={finishRecording}
              className= "bg-red-500 px-4 py-2 rounded-sm hover:bg-red-600 text-white text-sm cursor-pointer"
            >
              finish
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="bg-green-500 px-4 py-2 rounded-sm hover:bg-green-600 text-white text-sm cursor-pointer"
            >
              resume
            </button>

            <button
              onClick={finishRecording}
              className="bg-red-500 px-4 py-2 rounded-sm hover:bg-red-600 text-white text-sm cursor-pointer"
            >
              finish
            </button>
          </>
        )}

      </div>

      {/*print the playback*/}
      {audioURL && status !== "recording" && (
        <div className="flex flex-col items-center gap-1">
          <audio ref={audioRef} controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default Recorder;