"use client"

import { Document, Page, pdfjs } from "react-pdf";
// import { pdfjs} from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// import { pdfjs } from 'react-pdf/dist/entry.webpack';


// for pdf react to work we need to provide the worker for pdf render (from documentation)
// we are using external CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//     'pdfjs-dist/build/pdf.worker.min.mjs',
//     import.meta.url,
//   ).toString();
// pdfjs.GlobalWorkerOptions.workerSrc = 'pdf-reader\node_modules\pdfjs-dist\build\pdf.worker.mjs';
// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/latest/pdf.worker.js`;


// this is the child component so the value passed by the '[fileid]/dashboard'
// will be passed to this component as props and this wiil show that to us
interface PdfRendererProps {
    url: string
}

const PdfRender = ({ url }: PdfRendererProps) => {
    
    console.log('PDF URL:', url);

    return (
        <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
            {/* pdf options like zoom, next page, rotate */}
            <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                    Top bar
                </div>
            </div>

            {/* pdf preview */}
            <div className="flex-1 w-full max-h-screen">
                <div>
                    <Document file={`https://utfs.io/f/${url}`} className="max-h-full">
                        <Page pageNumber={1} />
                    </Document>
                </div>
            </div>

        </div>
    )
}

export default PdfRender