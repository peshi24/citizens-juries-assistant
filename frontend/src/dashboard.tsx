//import components
import { useState } from 'react';
import Recorder from './components/recorder';
import FileUpload from './components/fileupload';
import TranscriptionOutput from './components/transcription';

//import icons
import { MdOutlineHome } from "react-icons/md";

//app main UI
// Dashboard composes the recorder, file upload, and transcription panels.
// It holds the transcription/diarization results in state and passes them to the output component.
function Dashboard() {
  const [transcriptionResults, setTranscriptionResults] = useState<{
    transcription?: {
      text?: string;
      segments?: Array<{ start: number; end: number; text?: string }>;
    };
    diarization?: {
      segments?: Array<{ start: number; end: number; speaker?: string }>;
    };
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  return (
  <div className='flex'>
    {/*main div*/}
    <div className='flex flex-col h-screen w-screen p-2'>
      
      {/*header div*/}
      <div className='flex items-center justify-between bg-gray-100 h-[5%] p-2 text-sm font-medium'>
        <p className='pl-2 italic'>Session 1: Mozambique</p>
        
        {/*icons*/}
        <div className='flex gap-5 mr-3'>
          <FileUpload />
          <button className='flex gap-1 cursor-pointer'><p>home</p><MdOutlineHome className='text-xl'/></button>
        </div>

      </div>

      {/*recording div*/}
      <div className='flex bg-gray-100 h-[8%] p-2 mt-2 mb-2 justify-start items-center'>
        {/*recording button*/}
        <Recorder
          onResults={(results) => setTranscriptionResults(results)}
          onProcessing={(loading) => setIsProcessing(loading)}
        />
      </div>
      
      {/*dashboard div*/}
      <div className='flex flex-1 flex-row'>
        
        {/*panel div left*/}
        <div className='flex flex-col mt-0 mr-0 w-[25%]'>
          
          {/*summaries*/}
          <div className='flex bg-purple-100 flex-1 mb-2'>
            <div className='flex flex-col bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-left text-sm'>
              <p className='flex-1'>summaries: bullet point format</p>
              <p className='mt-auto italic'>refreshed 2 mintues ago</p>
            </div>
          </div>

          {/*participation poll: horizontal bar graph*/}
          <div className='flex bg-green-100 h-[35%]'>
            <div className='flex bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-center text-sm'>
              <p>participation poll: horizontal bar graph</p>
            </div>
          </div>

        </div>

        {/*transcription div*/}
        <div className='flex flex-col bg-blue-100 ml-2 mr-2 p-2 w-[65%] items-center'>
          
          {/*diarized transcript*/}
          <TranscriptionOutput
            results={transcriptionResults}
            loading={isProcessing}
          />
      
          {/*fact checker*/}
          <div className="flex rounded-xl bg-blue-300 p-4 mt-auto mb-3 w-[90%] h-[15%] items-center justify-center text-white text-sm">
            <p>fact checker: claim bridge and will only show up when there is evidence for support/reject</p>
          </div>

        </div>

        {/*panel div right*/}
        <div className=' flex flex-col w-[20%]'>

          {/*facilitator prompt box*/}
          <div className="flex flex-col bg-yellow-100 mb-2 p-2 h-[35%]">
            
            {/*generated prompt*/}
            <div className='flex flex-1 bg-white w-[100%] mb-2 overflow-y-auto p-4 text-center text-sm'>
              <p>suggested prompt: </p>
            </div>

            <button className="flex mt-auto mx-auto h-8 w-[90%] items-center justify-center cursor-pointer rounded bg-blue-500 text-white text-sm hover:bg-blue-600">
              regenerate!
            </button>

          </div>

          {/*values that have been identfied: weighted list*/}
          <div className='flex flex-1 bg-red-100 h-[20%] p-2'>
            <div className='flex flex-1 bg-white w-[100%] overflow-y-auto p-4 text-left text-sm'>
              <p>hierarchial list of all the values that have been identified</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
  );
}

export default Dashboard;
