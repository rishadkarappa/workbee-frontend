import { useRef, useState, useCallback, useEffect } from "react"
import { Mic, Trash2, Loader2, Square } from "lucide-react"
import { toast } from "sonner"
import { CloudinaryWorkMediaService } from "@/services/cloudinary-work-media-service"
import type { MediaItem } from "@/services/cloudinary-work-media-service"

interface VoiceRecorderProps {
  value: MediaItem | null
  onChange: (value: MediaItem | null) => void
}

const MIN_RECORDING_MS = 800
const CANCEL_DRAG_PX = 80

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ]
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ""
}

export function VoiceRecorder({ value, onChange }: VoiceRecorderProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "uploading">("idle")
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startYRef = useRef<number>(0)
  const cancelledRef = useRef(false)
  const mimeTypeRef = useRef<string>("")

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    return () => {
      clearTimer()
      stopStream()
    }
  }, [])

  const uploadRecording = useCallback(async (blob: Blob) => {
    setStatus("uploading")
    try {
      const extension = mimeTypeRef.current.includes("mp4") ? "m4a" : "webm"
      const file = new File([blob], `voice-note-${Date.now()}.${extension}`, {
        type: mimeTypeRef.current || blob.type,
      })

      // Cloudinary stores/streams audio files under the "video" resource type.
      const media = await CloudinaryWorkMediaService.uploadFile(file, "video")
      onChange(media)
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload voice note")
    } finally {
      setStatus("idle")
      setElapsedMs(0)
    }
  }, [onChange])

  const startRecording = useCallback(async (clientY: number) => {
    if (status !== "idle") return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      cancelledRef.current = false
      startYRef.current = clientY

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        clearTimer()
        stopStream()

        const duration = Date.now() - startTimeRef.current
        setStatus("idle")
        setIsCancelling(false)

        if (cancelledRef.current || duration < MIN_RECORDING_MS) {
          setElapsedMs(0)
          chunksRef.current = []
          if (!cancelledRef.current) {
            toast.warning("Hold the button a little longer to record")
          }
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" })
        chunksRef.current = []
        void uploadRecording(blob)
      }

      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()
      recorder.start()
      setStatus("recording")
      setElapsedMs(0)

      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 100)
    } catch (err) {
      console.error(err)
      toast.error("Microphone permission is required to record a voice note")
    }
  }, [status, uploadRecording])

  const finishRecording = useCallback((cancelled: boolean) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      cancelledRef.current = cancelled
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    void startRecording(e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (status !== "recording") return
    const dragUp = startYRef.current - e.clientY
    setIsCancelling(dragUp > CANCEL_DRAG_PX)
  }

  const handlePointerUp = () => {
    if (status !== "recording") return
    finishRecording(isCancelling)
  }

  const removeRecording = () => {
    onChange(null)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (value?.url) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        <audio controls src={value.url} className="h-9 flex-1" />
        <button
          type="button"
          onClick={removeRecording}
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
          aria-label="Remove voice note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => status === "recording" && finishRecording(isCancelling)}
        onPointerCancel={() => status === "recording" && finishRecording(true)}
        onContextMenu={(e) => e.preventDefault()}
        disabled={status === "uploading"}
        className={`
          select-none touch-none flex items-center gap-2 rounded-full px-5 py-3
          text-sm font-medium transition-colors
          ${status === "recording"
            ? isCancelling
              ? "bg-destructive text-destructive-foreground"
              : "bg-red-500 text-white"
            : "bg-muted text-foreground hover:bg-accent"}
          disabled:opacity-50
        `}
      >
        {status === "uploading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : status === "recording" ? (
          <>
            <Square className="h-4 w-4" />
            {isCancelling ? "Release to cancel" : `Recording ${formatTime(elapsedMs)} — release to send`}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Hold to record a voice note
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Press and hold the button, speak, then release to save. Slide up while holding to cancel.
      </p>
    </div>
  )
}