"use client"

import { ChevronDown, ChevronUp, Divide, Loader2, RotateCw, Search } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
// import { pdfjs} from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import SimpleBar from "simplebar-react"
import PdfFullscreen from "./PdfFullscreen";


// for pdf react to work we need to provide the worker for pdf render (from documentation)
// we are using external CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//     'pdfjs-dist/build/pdf.worker.min.mjs',
//     import.meta.url,
//   ).toString();



// this is the child component so the value passed by the '[fileid]/dashboard'
// will be passed to this component as props and this wiil show that to us
interface PdfRendererProps {
    url: string
}

const PdfRender = ({ url }: PdfRendererProps) => {

    console.log('PDF URL:', url);

    const { toast } = useToast()

    const [numPages, setNumPages] = useState<number>()
    const [currPage, setCurrPage] = useState<number>(1)
    // for changing the scale of the pdf like zoom in/out 100%, 125%
    const [scale, setScale] = useState<number>(1)
    // rotate the pdf
    const [rotation, setRotation] = useState<number>(0)

    // loading state while loading the pdf when changing scale
    const [renderedScale, setRenderedScale] = useState<number | null>(null)
    const isLoading = renderedScale !== scale

    // schema validation library from 'zod' to validate the entered number in page search in pdf view
    const CustomPageValidator = z.object({
        page: z.string().refine((num) => Number(num) > 0 && Number(num) <= numPages!)
    })
    type TCustomPageValidator = z.infer<typeof CustomPageValidator>
    // use this for the input for the page no in pdf view
    // jump over to the page no entered
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<TCustomPageValidator>({
        defaultValues: {
            page: "1"
        },
        resolver: zodResolver(CustomPageValidator)
    })

    // make pdf resizable when we chagne the size of the screen 
    const { width, ref } = useResizeDetector()

    const handlePageSubmit = ({ page }: TCustomPageValidator) => {  // type of page parameter is of TCustom that we created
        setCurrPage(Number(page))  // takes "page" as a input in this function
        setValue("page", String(page))
    }

    return (
        <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
            {/* pdf options like zoom, next page, rotate */}
            <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                    <Button disabled={currPage <= 1}
                        onClick={() => {
                            setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
                            setValue("page", String(currPage - 1))
                        }}
                        variant="ghost" aria-label="previous page">
                        <ChevronDown className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1.5">
                        <Input {...register("page")}  // taking number input for page number jump 
                            className={cn("w-12 h-8", errors.page && "focus-visible:ring-red-500")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter")  // jump to pae after pressing enter button
                                {
                                    handleSubmit(handlePageSubmit)()  // custom function "handlePageSubmit"
                                }
                            }}
                        />
                        <p className="text-zinc-700 text-sm space-x-1">
                            <span>/</span>
                            <span>{numPages ?? "x"}</span>
                        </p>
                    </div>

                    <Button disabled={numPages === undefined || currPage === numPages}
                        onClick={() => {
                            setCurrPage((prev) => prev + 1 > numPages! ? numPages! : prev + 1)
                            setValue("page", String(currPage + 1)) // increment the page no value
                        }}
                        variant="ghost" aria-label="next page">
                        <ChevronUp className="h-4 w-4" />
                    </Button>

                </div>

                {/* Zoom button */}
                <div className="space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="gap-1.5" aria-label="zoom" variant="ghost">
                                <Search className="h-4 w-4" />
                                {scale * 100}%<ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setScale(0.5)}>
                                50%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(1)}>
                                100%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(1.25)}>
                                125%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(1.5)}>
                                150%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(2)}>
                                200%
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setScale(2.5)}>
                                250%
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* rotate button below*/}
                    <Button onClick={() => setRotation((prev) => prev + 90)}
                    variant="ghost" aria-label="rotate 90 degree">
                        <RotateCw className="h-4 w-4"/>
                    </Button>

                    {/* Full screen view button making with custom component */}
                    <PdfFullscreen fileUrl={url} />
                </div>

            </div>

            {/* pdf preview */}
            <div className="flex-1 w-full max-h-screen">
                <SimpleBar autoHide className="max-h-[calc(100vh-10rem)]">  {/* to change the scale of pdf when zoom in/out */}
                    <div ref={ref}>
                        <Document loading={
                            <div className="flex justify-center">
                                <Loader2 className="my-24 h-6 w-6 animate-spin" />
                            </div>
                        }
                            onLoadError={() => {
                                toast({
                                    title: 'Error loading PDF',
                                    description: "Please try again later",
                                    variant: "destructive",
                                })
                            }}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            file={url} 
                            className="max-h-full">
                            {isLoading && renderedScale ? <Page
                                width={width ? width : 1}
                                pageNumber={currPage}
                                scale={scale}
                                rotate={rotation}
                                key={"@" + renderedScale}
                            /> : null}

                            <Page className={cn(isLoading ? "hidden" : "")}
                                width={width ? width : 1}
                                pageNumber={currPage}
                                scale={scale}
                                rotate={rotation}
                                key={"@" + scale}  // creating new page so giving identity
                                loading={
                                    <div className="flex justify-center">
                                        <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                    </div>
                                }
                                onRenderSuccess={() => setRenderedScale(scale)}
                            />
                        </Document>
                    </div>
                </SimpleBar>

            </div>

        </div>
    )
}

export default PdfRender