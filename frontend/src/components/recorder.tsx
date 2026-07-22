import { useState } from "react";

function Recorder() {
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const API = "http://127.0.0.1:8000";

  const startRecording = async () => {
    try {
      const response = await fetch(`${API}/start`, {
        method: "POST",
      });

      const data = await response.json();

      console.log(data);

      setAudioURL(null);
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

      setAudioURL(`${API}/recordings/${data.saved_to}`)
      
      setStatus("idle");
    } catch (err) {
      console.error(err);
    }
  };

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

      {audioURL && (
        <div className="flex flex-col items-center gap-1">
          <audio controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default Recorder;