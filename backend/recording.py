
"""Backend recording API for capturing microphone audio and saving WAV files."""

# Handles background threading for the recorder loop.
import threading
# Provides time-based delays while the recorder waits between audio chunks.
import time
# Enables WAV file creation and writing.
import wave
# Gives access to timestamp formatting for unique recording filenames.
from datetime import datetime
from tempfile import NamedTemporaryFile
import copy

# Provides microphone input support for capturing audio.
import pyaudio
# Core FastAPI classes for creating the API server and handling errors.
from fastapi import FastAPI, HTTPException
# Allows the backend to accept requests from the frontend during local development.
from fastapi.middleware.cors import CORSMiddleware
# Lets the API return audio files to the browser for playback.
from fastapi.responses import FileResponse

# Used for working with file paths and the recordings folder.
import os

from transcribe import transcribe_and_diarize

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDINGS_DIR = os.path.join(BASE_DIR, "recordings")

app = FastAPI()

# Enable CORS so the frontend running on localhost can reach the backend API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio settings used when opening the microphone stream and writing WAV files.
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024


class AudioRecorder:
    """Capture audio from the microphone and stream audio to live transcription while saving WAV files."""

    def __init__(self):
        # Threading primitives used to control recording state safely.
        self.recording_event = threading.Event()
        self.pause_event = threading.Event()

        # Background thread and lock for coordinating recording work.
        self.thread = None
        self.update_thread = None
        self.lock = threading.Lock()

        # In-memory audio chunks and file metadata for the current recording.
        self.frames = []
        self.filename = None
        self.file_path = None
        self.wave_writer = None

        # Track the latest live transcription and diarization state.
        self.live_transcription = {
            "text": "",
            "segments": [],
        }
        self.live_diarization = {"segments": []}
        self.last_transcription_update = None
        self.last_diarization_update = None
        self.last_transcribed_frame_count = 0

    def is_recording(self):
        """Return whether audio capture is currently active."""
        return self.recording_event.is_set()

    def is_paused(self):
        """Return whether the current recording session is paused."""
        return self.pause_event.is_set()

    def start(self):
        """Start a new recording session and launch the audio capture thread."""
        with self.lock:

            if self.is_recording():
                return False

            self.frames = []
            self.live_transcription = {"text": "", "segments": []}
            self.live_diarization = {"segments": []}
            self.last_transcription_update = datetime.now().isoformat()
            self.last_diarization_update = datetime.now().isoformat()

            self.filename = f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
            self.file_path = os.path.join(RECORDINGS_DIR, self.filename)
            self.wave_writer = None

            os.makedirs(RECORDINGS_DIR, exist_ok=True)

            self.temp_audio = NamedTemporaryFile(suffix=".wav", delete=False)

            self.recording_event.set()
            self.pause_event.clear()

            self.thread = threading.Thread(
                target=self._record_audio,
                daemon=True
            )

            self.update_thread = threading.Thread(
                target=self._live_transcription_loop,
                daemon=True,
            )

            self.thread.start()
            self.update_thread.start()

            return True

    def pause(self):
        """Pause audio capture while leaving the recording session open."""
        with self.lock:

            if not self.is_recording():
                return False

            self.pause_event.set()
            return True

    def resume(self):
        """Resume a paused recording session so audio capture continues."""
        with self.lock:

            if not self.is_recording():
                return False

            self.pause_event.clear()
            return True

    def stop(self):
        """Stop recording, wait for the worker thread to finish, and return the saved filename."""
        with self.lock:

            if not self.is_recording():
                return None

            self.recording_event.clear()

        if self.thread:
            self.thread.join()

        if self.update_thread:
            self.update_thread.join()

        return self.filename

    def get_live_status(self):
        """Return a copy of the current live transcription and diarization state."""
        with self.lock:
            return {
                "recording": self.is_recording(),
                "paused": self.is_paused(),
                "filename": self.filename,
                "transcription": copy.deepcopy(self.live_transcription),
                "diarization": copy.deepcopy(self.live_diarization),
                "last_transcription_update": self.last_transcription_update,
                "last_diarization_update": self.last_diarization_update,
            }

    def _build_wav_snapshot(self, frames):
        """Write a temporary WAV snapshot from recorded frames for live transcription."""
        with NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            with wave.open(tmp_file.name, "wb") as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(pyaudio.PyAudio().get_sample_size(FORMAT))
                wf.setframerate(RATE)
                wf.writeframes(b"".join(frames))
            return tmp_file.name

    def _update_live_results(self, results):
        """Store the most recent transcription and diarization results for frontend polling."""
        with self.lock:
            self.live_transcription = results.get("transcription", self.live_transcription)
            self.live_diarization = results.get("diarization", self.live_diarization)
            self.last_transcription_update = datetime.now().isoformat()
            self.last_diarization_update = datetime.now().isoformat()

    def _live_transcription_loop(self):
        """Background worker that periodically transcribes the current audio while recording."""
        while self.recording_event.is_set():
            if self.pause_event.is_set():
                time.sleep(0.5)
                continue

            with self.lock:
                current_frames = list(self.frames)
                frame_count = len(current_frames)

            if frame_count == 0 or frame_count == self.last_transcribed_frame_count:
                time.sleep(1.0)
                continue

            self.last_transcribed_frame_count = frame_count

            try:
                snapshot_path = self._build_wav_snapshot(current_frames)
                results = transcribe_and_diarize(snapshot_path)
                os.remove(snapshot_path)
                self._update_live_results(results)
            except Exception as exc:
                print(f"Live transcription error: {exc}")

            time.sleep(2.0)

    def _record_audio(self):
        """Background worker that reads microphone frames and writes them into a WAV file."""

        p = pyaudio.PyAudio()
        stream = None

        try:
            stream = p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
            )

            sample_width = p.get_sample_size(FORMAT)

            # Keep the WAV file open so pause/resume writes to the same file.
            with wave.open(self.file_path, "wb") as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(sample_width)
                wf.setframerate(RATE)

                self.wave_writer = wf

                print("Recording started.")

                while self.recording_event.is_set():
                    if self.pause_event.is_set():
                        time.sleep(0.1)
                        continue

                    try:
                        data = stream.read(
                            CHUNK,
                            exception_on_overflow=False,
                        )
                        self.frames.append(data)
                        wf.writeframes(data)

                    except Exception as e:
                        print(f"Audio read error: {e}")

            self.wave_writer = None

        finally:
            if stream:
                stream.stop_stream()
                stream.close()

            p.terminate()
            print("Recording saved.")


# Create a single recorder instance used by the API endpoints.
recorder = AudioRecorder()


@app.post("/start")
def start_recording():
    """API endpoint to begin recording audio and return the active filename."""
    if recorder.start():
        return {
            "status": "Recording started",
            "filename": recorder.filename,
        }

    return {
        "status": "Already recording"
    }


@app.post("/pause")
def pause_recording():
    """API endpoint to pause the active recording session."""
    if not recorder.is_recording():
        return {
            "status": "Not recording"
        }

    if recorder.is_paused():
        return {
            "status": "Already paused",
            "filename": recorder.filename,
        }

    recorder.pause()

    return {
        "status": "Recording paused",
        "filename": recorder.filename,
    }


@app.post("/resume")
def resume_recording():
    """API endpoint to resume a paused recording session."""
    if not recorder.is_recording():
        return {
            "status": "Not recording"
        }

    if not recorder.is_paused():
        return {
            "status": "Already recording",
            "filename": recorder.filename,
        }

    recorder.resume()

    return {
        "status": "Recording resumed",
        "filename": recorder.filename,
    }


@app.post("/stop")
def stop_recording():
    """API endpoint to stop recording, save the file, and run final transcription/diarization."""
    filename = recorder.stop()

    if filename is None:
        return {
            "status": "Not recording"
        }

    file_path = os.path.join(RECORDINGS_DIR, filename)

    try:
        results = transcribe_and_diarize(file_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription/diarization failed: {exc}")

    return {
        "status": "Recording stopped",
        "saved_to": filename,
        "results": results,
    }


@app.get("/status")
def status():
    """API endpoint returning the current recording state for UI updates."""
    return recorder.get_live_status()


@app.get("/recordings/{filename}")
def get_recording(filename: str):
    """API endpoint to return a saved WAV recording file for frontend playback."""
    file_path = os.path.join(RECORDINGS_DIR, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Recording not found")

    return FileResponse(file_path, media_type="audio/wav")


@app.get("/status")
def status():
    """API endpoint returning the current recording state for UI updates."""
    return {
        "recording": recorder.is_recording(),
        "paused": recorder.is_paused(),
        "filename": recorder.filename,
    }


# Run the FastAPI server directly when this file is executed.
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )