
"""Transcription and diarization helpers for saved audio files."""

from faster_whisper import WhisperModel
from pyannote.audio import Pipeline

# Load Whisper transcription model once per process so repeated calls reuse the same model.
model = WhisperModel(
    "medium",
    device="auto",
    compute_type="float16"
)

# Load the speaker diarization pipeline once so it can be reused for each file.
pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization"
)


def transcribe_audio(file_path: str) -> dict:
    """Transcribe a saved audio file and return structured timestamped segments."""
    result = model.transcribe(file_path, word_timestamps=True)

    transcript_text = getattr(result, "text", "")
    segments = []

    for segment in getattr(result, "segments", []):
        # Build a segment record containing start/end times, text, and word-level timestamps.
        segments.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text,
            "words": [
                {
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                }
                for word in getattr(segment, "words", [])
            ],
        })

    return {
        "text": transcript_text,
        "segments": segments,
    }


def diarize_audio(file_path: str) -> dict:
    """Diarize a saved audio file and return speaker turn segments."""
    diarization = pipeline(file_path)
    segments = []

    for turn, track, label in diarization.itertracks(yield_label=True):
        # Each diarization turn contains start/end times and a speaker label.
        segments.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": label,
        })

    return {
        "segments": segments,
    }


def transcribe_and_diarize(file_path: str) -> dict:
    """Run transcription followed by speaker diarization on a saved file."""
    return {
        "transcription": transcribe_audio(file_path),
        "diarization": diarize_audio(file_path),
    }
