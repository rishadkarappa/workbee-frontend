import { useRef, useState } from "react"
import { Plus, X, Loader2, ImageIcon, VideoIcon } from "lucide-react"
import { CloudinaryWorkMediaService } from "@/services/cloudinary-work-media-service"
import type { MediaItem } from "@/services/cloudinary-work-media-service"
import { toast } from "sonner"

interface UploadSlot {
  id: string
  previewUrl: string
  status: "uploading" | "done" | "error"
  progress: number
  media?: MediaItem
}

interface MediaUploaderProps {
  type: "image" | "video"
  max: number
  value: MediaItem[]
  onChange: (items: MediaItem[]) => void
}

export function MediaUploader({ type, max, value, onChange }: MediaUploaderProps) {
  const [slots, setSlots] = useState<UploadSlot[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCount = value.length + slots.filter(s => s.status === "uploading").length
  const canAddMore = totalCount < max

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = max - totalCount
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToUpload) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const previewUrl = URL.createObjectURL(file)

      setSlots(prev => [...prev, { id, previewUrl, status: "uploading", progress: 0 }])

      try {
        const media = await CloudinaryWorkMediaService.uploadFile(file, type, (pct) => {
          setSlots(prev => prev.map(s => s.id === id ? { ...s, progress: pct } : s))
        })

        setSlots(prev => prev.filter(s => s.id !== id))
        onChange([...value, media])
      } catch (err) {
        console.error(err)
        toast.error(`Failed to upload ${type}`)
        setSlots(prev => prev.filter(s => s.id !== id))
      }
    }

    if (inputRef.current) inputRef.current.value = ""
  }

  const removeUploaded = (publicId: string) => {
    onChange(value.filter(m => m.publicId !== publicId))
  }

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((item) => (
        <div key={item.publicId} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border group">
          {type === "image" ? (
            <img src={item.url} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <video src={item.url} className="h-full w-full object-cover" muted />
          )}
          <button
            type="button"
            onClick={() => removeUploaded(item.publicId)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {slots.map((slot) => (
        <div key={slot.id} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
          {type === "image" ? (
            <img src={slot.previewUrl} alt="uploading" className="h-full w-full object-cover opacity-50" />
          ) : (
            <video src={slot.previewUrl} className="h-full w-full object-cover opacity-50" muted />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-xs gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            {slot.progress}%
          </div>
        </div>
      ))}

      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          {type === "image" ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={type === "image" ? "image/*" : "video/*"}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}