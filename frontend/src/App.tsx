//import components
import Recorder from './components/recorder';

//app main UI
function App() { 
  return (
  <div className='flex'>
    {/*main div --------------------------------------------------------------------*/}
    <div className='flex flex-col h-screen w-[96%]'>
      {/*recording div ------------------------------------------------------------------*/}
      <div className='bg-blue-100 h-15 m-4 p-7 pl-4 flex justify-start items-center'>
        {/*recording button*/}
        <Recorder/>
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

    {/*sidepanel div ------------------------------------------------------------------------*/}
      <div className='bg-purple-100 h-screen w-[3%] ml-auto'> 
        
      </div>
    </div>
  );
}

export default App
