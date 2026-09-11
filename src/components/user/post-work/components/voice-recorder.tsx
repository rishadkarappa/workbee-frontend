import { useRef, useState, useCallback, useEffect } from "react"
import { Mic, Trash2, Loader2, Square, Lock, Pause, Play, Send, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { CloudinaryWorkMediaService } from "@/services/cloudinary-work-media-service"
import type { MediaItem } from "@/services/cloudinary-work-media-service"

interface VoiceRecorderProps {
  value: MediaItem | null
  onChange: (value: MediaItem | null) => void
}

const MIN_RECORDING_MS = 800
const CANCEL_DRAG_PX = 80 // slide LEFT this far to cancel (pre-lock only)
const LOCK_DRAG_PX = 70   // slide RIGHT this far to lock

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
  // "idle" -> nothing happening
  // "recording" -> actively capturing (may or may not be locked)
  // "uploading" -> saving the finished clip
  const [status, setStatus] = useState<"idle" | "recording" | "uploading">("idle")
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false) // pre-lock, dragging left
  const [isLocked, setIsLocked] = useState(false)         // slid right far enough
  const [isPaused, setIsPaused] = useState(false)         // paused while locked
  const [dragProgress, setDragProgress] = useState(0)     // 0..1 progress toward lock (right drag)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number | null>(null)
  const totalPausedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startXRef = useRef<number>(0)
  const cancelledRef = useRef(false)
  const forceSendRef = useRef(false)
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

  const getElapsed = () => {
    const pausedNow = pausedAtRef.current ? Date.now() - pausedAtRef.current : 0
    return Date.now() - startTimeRef.current - totalPausedRef.current - pausedNow
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
      setIsLocked(false)
      setIsPaused(false)
      setDragProgress(0)
    }
  }, [onChange])

  const startRecording = useCallback(async (clientX: number) => {
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
      forceSendRef.current = false
      startXRef.current = clientX
      pausedAtRef.current = null
      totalPausedRef.current = 0

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        clearTimer()
        stopStream()

        const duration = getElapsed()

        setStatus("idle")
        setIsCancelling(false)
        setIsLocked(false)
        setIsPaused(false)
        setDragProgress(0)

        if (cancelledRef.current) {
          setElapsedMs(0)
          chunksRef.current = []
          return
        }

        if (duration < MIN_RECORDING_MS && !forceSendRef.current) {
          setElapsedMs(0)
          chunksRef.current = []
          toast.warning("Hold the button a little longer to record")
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
        setElapsedMs(getElapsed())
      }, 100)
    } catch (err) {
      console.error(err)
      toast.error("Microphone permission is required to record a voice note")
    }
  }, [status, uploadRecording])

  const finishRecording = useCallback((cancelled: boolean, force = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      cancelledRef.current = cancelled
      forceSendRef.current = force
      // MediaRecorder.stop() requires the recorder to not be in "paused" limbo on some browsers,
      // but Chrome/Firefox/Safari all support stopping directly from "paused" too.
      mediaRecorderRef.current.stop()
    }
  }, [])

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === "recording") {
      recorder.pause()
      pausedAtRef.current = Date.now()
      clearTimer()
      setIsPaused(true)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === "paused") {
      recorder.resume()
      if (pausedAtRef.current) {
        totalPausedRef.current += Date.now() - pausedAtRef.current
      }
      pausedAtRef.current = null
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setElapsedMs(getElapsed())
      }, 100)
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    void startRecording(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (status !== "recording" || isLocked) return

    const dx = e.clientX - startXRef.current

    if (dx >= 0) {
      // dragging right -> progress toward lock
      setIsCancelling(false)
      const progress = Math.min(dx / LOCK_DRAG_PX, 1)
      setDragProgress(progress)
      if (dx > LOCK_DRAG_PX) {
        setIsLocked(true)
        setDragProgress(1)
      }
    } else {
      // dragging left -> progress toward cancel
      setDragProgress(0)
      setIsCancelling(-dx > CANCEL_DRAG_PX)
    }
  }

  const handlePointerUp = () => {
    if (status !== "recording" || isLocked) return
    finishRecording(isCancelling)
  }

  const removeRecording = () => {
    onChange(null)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(ms, 0) / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // ---------- Playback of a saved recording ----------

  if (value?.url) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        <audio
          controls
          src={value.url}
          className="h-9 flex-1 dark:[color-scheme:dark]"
        />

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

  // ---------- Locked recording: full control bar ----------
  if (isLocked) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-border bg-muted/50 px-3 py-2">
        <button
          type="button"
          onClick={() => finishRecording(true)}
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
          aria-label="Delete recording"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isPaused ? "bg-muted-foreground" : "bg-red-500 animate-pulse"}`}
          />
          <span className="text-sm font-medium tabular-nums">{formatTime(elapsedMs)}</span>
          <span className="text-xs text-muted-foreground">
            {isPaused ? "Paused" : "Recording…"}
          </span>
        </div>

        <button
          type="button"
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={isPaused ? "Resume recording" : "Pause recording"}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => finishRecording(false, true)}
          className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity"
          aria-label="Send voice note"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ---------- Idle / actively holding (pre-lock) ----------
  return (
    <div className="flex flex-col items-start gap-2">
      {status === "recording" ? (
        <div className="relative flex w-full items-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isCancelling ? "bg-muted-foreground" : "bg-red-500 animate-pulse"}`}
          />
          <span className="text-sm font-medium tabular-nums">{formatTime(elapsedMs)}</span>

          <span
            className="ml-2 flex-1 text-xs text-muted-foreground transition-opacity"
            style={{ opacity: isCancelling ? 1 : 0.6 }}
          >
            {isCancelling ? "Release to cancel" : "◀ Slide left to cancel"}
          </span>

          {/* Slide-to-lock affordance, right side */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs" style={{ opacity: 1 - dragProgress * 0.6 }}>
              Slide to lock
            </span>
            <div className="relative h-8 w-8">
              <ChevronRight
                className="absolute inset-0 h-8 w-8 transition-transform"
                style={{
                  transform: `translateX(${dragProgress * 6}px)`,
                  opacity: 1 - dragProgress,
                }}
              />
              <Lock
                className="absolute inset-0 h-8 w-8 text-primary transition-transform"
                style={{
                  transform: `scale(${0.6 + dragProgress * 0.4})`,
                  opacity: dragProgress,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onPointerDown={handlePointerDown}
          disabled={status === "uploading"}
          className="select-none touch-none flex items-center gap-2 rounded-full bg-muted px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Hold to record a voice note
            </>
          )}
        </button>
      )}

      {/* Pointer tracking overlay: only needed while actively holding, pre-lock */}
      {status === "recording" && !isLocked && (
        <div
          className="fixed inset-0 z-50 cursor-grabbing"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => finishRecording(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: "none" }}
        />
      )}

      <p className="text-xs text-muted-foreground">
        {isLocked
          ? "Recording locked — use pause, delete or send."
          : "Press and hold, then slide right to lock hands-free recording, or left to cancel."}
      </p>
    </div>
  )
}