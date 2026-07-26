import { useEffect, useRef, useState } from "react";

function Recorder() {
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const API = "http://127.0.0.1:8000";

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current !== null) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

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
    } catch (err) {
      console.error(err);
    }
  };

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

  const finishRecording = async () => {
    try {
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

      clearRefreshTimer();
      setStatus("idle");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (status !== "recording" || !filename) {
      clearRefreshTimer();
      return;
    }

    updateAudioSource(filename);
    refreshTimerRef.current = window.setInterval(() => {
      updateAudioSource(filename);
    }, 1000);

    return () => {
      clearRefreshTimer();
    };
  }, [filename, status]);

  useEffect(() => {
    return () => {
      clearRefreshTimer();
    };
  }, []);

  console.log("Audio URL being displayed:", audioURL);

  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex gap-2">

        {status === "idle" && (
          <button
            onClick={startRecording}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Start 
          </button>
        )}

        {status === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="px-4 py-2 rounded bg-yellow-500 text-white"
            >
              Pause
            </button>

            <button
              onClick={finishRecording}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Finish
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="px-4 py-2 rounded bg-green-500 text-white"
            >
              Resume
            </button>

            <button
              onClick={finishRecording}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Finish
            </button>
          </>
        )}

      </div>

      {audioURL && status !== "recording" && (
        <div className="flex flex-col items-center gap-1">
          <audio ref={audioRef} controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default Recorder;