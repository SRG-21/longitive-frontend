import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import { ACCEPTED_DOCUMENT_TYPES, MAX_UPLOAD_BYTES } from '../lib/upload'

interface Props {
  onFile: (file: File) => void
  busy?: boolean
  label: string
}

/** Single-file image/PDF picker for the OCR upload endpoints. */
export default function FileDropzone({ onFile, busy, label }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_DOCUMENT_TYPES,
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: busy,
    onDropAccepted: (files) => onFile(files[0]),
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code
      toast.error(code === 'file-too-large' ? 'File is larger than 10MB' : 'Upload a JPG, PNG, WEBP, HEIC or PDF file')
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
      } ${busy ? 'cursor-wait opacity-60' : ''}`}
    >
      <input {...getInputProps()} />
      <UploadCloud size={24} className="text-primary" />
      <span className="font-medium text-foreground">{busy ? 'Extracting data…' : label}</span>
      <span className="text-xs text-muted-foreground">Image or PDF, up to 10MB. Drag and drop or click to choose.</span>
    </div>
  )
}
