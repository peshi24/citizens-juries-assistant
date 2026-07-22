import threading
import time
import wave
from datetime import datetime

import pyaudio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os

app = FastAPI()

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],     
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#audio configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024


class AudioRecorder:
    def __init__(self):
        self.recording_event = threading.Event()
        self.pause_event = threading.Event()

        self.thread = None
        self.lock = threading.Lock()

        self.frames = []
        self.filename = None

    def is_recording(self):
        return self.recording_event.is_set()

    def is_paused(self):
        return self.pause_event.is_set()

    def start(self):
        with self.lock:

            if self.is_recording():
                return False

            self.frames = []

            self.filename = os.path.join(
                "recordings",
                f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
            )

            self.recording_event.set()
            self.pause_event.clear()

            self.thread = threading.Thread(
                target=self._record_audio,
                daemon=True
            )

            self.thread.start()

            return True

    def pause(self):
        with self.lock:

            if not self.is_recording():
                return False

            self.pause_event.set()
            return True

    def resume(self):
        with self.lock:

            if not self.is_recording():
                return False

            self.pause_event.clear()
            return True

    def stop(self):

        with self.lock:

            if not self.is_recording():
                return None

            self.recording_event.clear()

        if self.thread:
            self.thread.join()

        return self.filename

    def _record_audio(self):

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

                except Exception as e:
                    print(f"Audio read error: {e}")

        finally:

            if stream:
                stream.stop_stream()
                stream.close()

            sample_width = p.get_sample_size(FORMAT)
            p.terminate()

            if self.frames:

                with wave.open(self.filename, "wb") as wf:
                    wf.setnchannels(CHANNELS)
                    wf.setsampwidth(sample_width)
                    wf.setframerate(RATE)
                    wf.writeframes(b"".join(self.frames))

            print("Recording saved.")


#recorder instance
recorder = AudioRecorder()


#api endpoints
@app.post("/start")
def start_recording():

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

    if not recorder.is_recording():
        return {
            "status": "Not recording"
        }

    if recorder.is_paused():
        return {
            "status": "Already paused"
        }

    recorder.pause()

    return {
        "status": "Recording paused"
    }


@app.post("/resume")
def resume_recording():

    if not recorder.is_recording():
        return {
            "status": "Not recording"
        }

    if not recorder.is_paused():
        return {
            "status": "Already recording"
        }

    recorder.resume()

    return {
        "status": "Recording resumed"
    }


@app.post("/stop")
def stop_recording():

    filename = recorder.stop()

    if filename is None:
        return {
            "status": "Not recording"
        }

    return {
        "status": "Recording stopped",
        "saved_to": filename,
    }


@app.get("/status")
def status():

    return {
        "recording": recorder.is_recording(),
        "paused": recorder.is_paused(),
        "filename": recorder.filename,
    }


#run server
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )