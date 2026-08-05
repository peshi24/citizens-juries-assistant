
//import icons
import { MdOutlineFileUpload } from "react-icons/md";

// FileUpload renders a simple upload button for future file import handling.
function FileUpload() {
  return (
    <button className='flex gap-2 cursor-pointer'>
      <p>file upload</p>
      <MdOutlineFileUpload className='text-xl' />
    </button>
  );
}

export default FileUpload;