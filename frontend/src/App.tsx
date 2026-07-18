//import components


//usestate
import { useState } from 'react';

//app main UI
function App() { 

  return (
  <div className='flex'>
    {/*main div --------------------------------------------------------------------*/}
    <div className='flex flex-col h-screen w-screen'>
      {/*recording div ------------------------------------------------------------------*/}
      <div className='bg-blue-100 h-[5%] m-4 flex justify-start items-center'>
        {/*recording button*/}
      </div>
      
      {/*big div ------------------------------------------------------------------------*/}
      <div className='flex flex-1 flex-row'>
        {/*panel div left ---------------------------------------------------------------------*/}
        <div className='flex flex-col m-4 mt-0 mr-0 w-[25%]'>
          {/*summaries*/}
          <div className='flex bg-purple-100 flex-1 mb-3'>
            <div className='flex bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-center'>

            </div>
          </div>

          {/*participation poll*/}
          <div className='flex bg-green-100 h-[25%] mb-3'>
            <div className='flex bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-center'>

            </div>
          </div>

          {/*values that have been identfied*/}
          <div className='flex bg-red-100 h-[20%]'>
            <div className='flex bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-center'>

            </div>
          </div>

        </div>

        {/*transcription div ------------------------------------------------------------*/}
        <div className='flex flex-col bg-blue-100 m-4 mt-0 w-[45%] items-center'>
          <div className='flex bg-white flex-1 mb-3 mt-2 ml-2 mr-2 w-[94%] p-4'>
            <p>transcription</p>
          </div>
      
          {/*fact checker ------------------------------------------------------------*/}
          <div className="p-4 mt-auto ml-2 mr-2 w-[90%] h-[20%] mb-3 flex items-center justify-center rounded bg-blue-300 font-medium text-white">
            <p>fact checker</p>
          </div>
        </div>

        {/*panel div right ---------------------------------------------------------------------*/}
        <div className=' flex flex-col m-4 ml-0 mt-0 w-[25%]'>
          {/*facilitator prompt box*/}
          <div className="flex flex-col bg-yellow-100 mb-3 h-[45%]">
            {/*generated prompt*/}
            <div className='flex bg-white w-[90%] flex-1 m-2 overflow-y-auto p-4 text-center'>

            </div>

            <button className="mt-auto mx-auto mb-3 flex h-10 w-[90%] items-center justify-center rounded bg-blue-500 font-medium text-white hover:bg-blue-600">
              regenerate!
            </button>
          </div>

          {/*policy proposal evaluation box*/}
          <div className='flex flex-col bg-gray-100 h-[55%] items-center'>
            {/*user input box*/}
            <textarea className='flex bg-white w-[90%] h-[30%] mt-2 mb-2 overflow-y-auto p-4 text-left'>
            </textarea>

            {/*ai response*/}
            <div className='flex bg-white flex-1 w-[90%] mb-2 overflow-y-auto p-4 text-left'>
              <p>ai response</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
  );
}

export default App;
