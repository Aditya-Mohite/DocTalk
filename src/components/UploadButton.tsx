// Client side component
// Upload pdf 

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"

// new library for the drag and drop and upload the pdf files
import Dropzone from "react-dropzone"
import { Cloud, File, Loader2 } from "lucide-react"
import { Progress } from "./ui/progress"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "./ui/use-toast"
import { trpc } from "@/app/_trpc/client"
import { useRouter } from "next/navigation"

const UploadDropzone = () => {

    const router = useRouter()

    // Loading state while uploading file
    const [isUploading, setIsUploading] = useState<boolean>(false)

    // Keep track of the uploading state of the file
    // If the pdf get uploaded then the user is redirected to the dashboard
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    const { toast } = useToast()

    // destructure from uploadthing from lib folder
    const { startUpload } = useUploadThing('pdfUploader')

    const { mutate: startPolling } = trpc.getFile.useMutation(
        {
        onSuccess: (file) => {
            // redirect to detailed view of the pdf   
            router.push(`/dashboard/${file.id}`)
        },
        retry: true,   // we get the response until we have the file in the database
        retryDelay: 500 // 500 milisecond half of second
    }
)

    // this function starts as soon as the user starts uploading the file 
    const startSimulatedProgress = () => {
        setUploadProgress(0)  // Initialise the upload progress as 0

        const interval = setInterval(() => {
            setUploadProgress((prevProgress) => {
                if (prevProgress >= 95) {
                    clearInterval(interval)
                    return prevProgress
                }
                return prevProgress + 5
            })
        }, 500)
        return interval
    }

    return (
        <Dropzone 
        multiple={false}
            onDrop={async (acceptedFile) => {
                setIsUploading(true)
                // start progress track as soon as the file is started uploading 
                const progressInterval = startSimulatedProgress()

                // await new Promise((resolve) => setTimeout(resolve, 2000))

                // handle file uploading
                // start uploading as soon as the file is get selected
                const res = await startUpload(acceptedFile) 

                if (!res) {
                    return toast({
                        title: 'Something went wrong',
                        description: 'Please try again later',
                        variant: 'destructive',
                    })
                }

                const [fileResponse] = res  // get response
                const key = fileResponse?.key
                if (!key) {
                    return toast({
                        title: 'Something went wrong',
                        description: 'Please try again later',
                        variant: 'destructive',
                    })
                }

                // when file uploading is done then clear the interval
                clearInterval(progressInterval)
                // tell user that the file uploading has been done
                setUploadProgress(100)

                // Start polling 
                // Polling: In specific time interval check if the file is there in the database and for regular updates call the api to the same database endpoint
                //          for this puspose we make api call every half second
                //          this will happen after the file is being uploaded and it will check for the updates
                //          after uploading it will redirect to the pdf view page 
                startPolling({ key })
            }}>
            {/* destructuring with our custom callback function */}
            {({ getRootProps, getInputProps, acceptedFiles }) => (
                <div {...getRootProps()}
                    className="border h-64 m-4 border-dashed border-gray-300 rounded-lg">
                    {/* This hidden input allows the file explorer to open when clicked */}
                    <input {...getInputProps()} />
                    <div className="flex items-center justify-center h-full w-full">
                        <label htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                                <p className="mb-2 text-sm text-zinc-700">
                                    <span className="font-semibold">Click to upload</span>{' '}or drag and drop
                                </p>
                                <p className="text-sm text-zinc-500">PDF (up to 4MB)</p>
                            </div>

                            {/* give user feedback when file is uploaded */}
                            {acceptedFiles && acceptedFiles[0] ? (
                                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                                    <div className="px-3 py-2 h-full grid place-items-center">
                                        <File className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="px-3 py-2 h-full text-sm truncate">
                                        {acceptedFiles[0].name}
                                    </div>
                                </div>
                            ) : null}

                            {/* show the uploading state */}
                            {isUploading ? (
                                <div className="w-full mt-4 max-w-xs mx-auto">
                                    <Progress
                                        indicatorColor={uploadProgress === 100 ? "bg-green-500" : ""}
                                        value={uploadProgress} className="h-1 w-full bg-zinc-200" />
                                    {uploadProgress === 100 ? (
                                        <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 pt-2">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Redirecting...
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            {/* end of uploading state */}

                        </label>
                    </div>
                </div>
            )}
        </Dropzone>
    )
}

const UploadButton = () => {

    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={(visible) => {
            if (!visible) {
                setIsOpen(visible)
            }
        }}>
            {/* we want a customized button so we pass the button as 'asChild' inside the DialogTrigger Button*/}
            <DialogTrigger onClick={() => setIsOpen(true)} asChild>
                <Button>Upload PDF</Button>
            </DialogTrigger>

            <DialogContent>
                <UploadDropzone />
            </DialogContent>

        </Dialog>
    )
}

export default UploadButton 