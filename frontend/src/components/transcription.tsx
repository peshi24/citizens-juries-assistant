
interface TranscriptionOutputProps {
  results?: {
    transcription?: {
      text?: string;
      segments?: Array<{ start: number; end: number; text?: string }>;
    };
    diarization?: {
      segments?: Array<{ start: number; end: number; speaker?: string }>;
    };
  } | null;
  loading?: boolean;
}

// Render the transcription and speaker diarization results returned by the backend.
function TranscriptionOutput({ results, loading }: TranscriptionOutputProps) {
  const transcriptText = results?.transcription?.text ?? "";
  const speakerSegments = results?.diarization?.segments ?? [];
  const textSegments = results?.transcription?.segments ?? [];

  return (
    <div className='flex flex-1 bg-white w-[100%] mb-5 p-4 overflow-y-auto text-sm text-left'>
      {loading ? (
        <p>Processing transcription and diarization...</p>
      ) : !results ? (
        <p>No transcript available yet. Record audio and press finish to generate results.</p>
      ) : (
        <div className='space-y-4 w-full'>
          <div>
            <h2 className='font-semibold mb-2'>Transcript</h2>
            <p className='whitespace-pre-wrap'>{transcriptText || "Transcript is empty."}</p>
          </div>

          <div>
            <h3 className='font-semibold mb-2'>Text segments</h3>
            {textSegments.length === 0 ? (
              <p className='text-xs text-gray-600'>No timestamped transcription segments available.</p>
            ) : (
              <ul className='list-disc list-inside space-y-1'>
                {textSegments.map((segment, index) => (
                  <li key={index}>
                    <strong>[{segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s]</strong> {segment.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className='font-semibold mb-2'>Speaker diarization</h3>
            {speakerSegments.length === 0 ? (
              <p className='text-xs text-gray-600'>No speaker segments detected.</p>
            ) : (
              <ul className='list-disc list-inside space-y-1'>
                {speakerSegments.map((segment, index) => (
                  <li key={index}>
                    <strong>{segment.speaker ?? 'Speaker'}</strong> <em>({segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s)</em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

//return statement
export default TranscriptionOutput;