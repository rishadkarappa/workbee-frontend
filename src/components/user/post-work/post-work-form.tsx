import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import TaskBookStepper, { Step } from "./components/task-book-stepper"
import { WorkService } from "@/services/work-service"
import AddressAutocomplete from "../AddressAutocomplete"
import { getErrorMessage } from "@/utils/error-helper"
import { AppRoutes } from "@/constants/routes/app-routes"
import { toast } from "sonner"
import { PhoneInput } from "../../ui/phone-input"
import SelectWorkCategory from "./components/select-work-gategory"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CalendarIcon,
  Check,
  BookOpenCheck,
} from "lucide-react"
import {
  TimePicker,
  TimePickerContent,
  TimePickerHour,
  TimePickerInput,
  TimePickerInputGroup,
  TimePickerLabel,
  TimePickerMinute,
  TimePickerPeriod,
  TimePickerSeparator,
  TimePickerTrigger,
} from "@/components/ui/time-picker"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { MediaItem } from "@/services/cloudinary-work-media-service"
import { MediaUploader } from "./components/media-uploader"
import { VoiceRecorder } from "./components/voice-recorder"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PostingGuidelinesDialogProps {
  hasRead: boolean
  onFinishedReading: () => void
}

/* 
   POSTING GUIDELINES DIALOG
 */

function PostingGuidelinesDialog({
  hasRead,
  onFinishedReading,
}: PostingGuidelinesDialogProps) {
  const [open, setOpen] = useState(false)
  const [hasReachedEnd, setHasReachedEnd] = useState(hasRead)

  /*
   * Reset the internal scroll state whenever the dialog opens.
   * If the user has already completed the guidelines previously,
   * keep the button enabled.
   */
  useEffect(() => {
    if (open) {
      setHasReachedEnd(hasRead)
    }
  }, [open, hasRead])

  const handleScroll = (
    event: React.UIEvent<HTMLDivElement>
  ) => {
    const target = event.target as HTMLElement

    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight <= 8

    if (isAtBottom) {
      setHasReachedEnd(true)
    }
  }

  const handleDone = () => {
    if (!hasReachedEnd) return

    onFinishedReading()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          Read the posting guidelines
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Posting Guidelines
          </DialogTitle>

          <DialogDescription>
            Please read the guidelines carefully. Scroll to the
            bottom to continue.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea
          className="h-72 rounded-md border"
          onScrollCapture={handleScroll}
        >
          <div className="flex flex-col gap-4 p-4 text-sm leading-relaxed">
            <div>
              <h4 className="mb-1 font-medium text-foreground">
                1. Be clear and specific
              </h4>

              <p className="text-muted-foreground">
                Describe exactly what needs to be done, including
                size, quantity, and any materials involved. Clear
                tasks get faster, more accurate offers from workers.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                2. Set a fair budget
              </h4>

              <p className="text-muted-foreground">
                Base your budget on the time, effort, and skill the
                task requires. Unrealistically low budgets often go
                unanswered or attract lower quality offers.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                3. Share accurate location details
              </h4>

              <p className="text-muted-foreground">
                Provide the correct address, landmark, and access
                instructions so the worker can reach the site
                without delays.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                4. Keep communication on-platform
              </h4>

              <p className="text-muted-foreground">
                All messages, payments, and task discussions should
                happen within the app. This keeps you protected under
                our support and dispute policies.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                5. No prohibited tasks
              </h4>

              <p className="text-muted-foreground">
                Tasks involving illegal activity, hazardous work
                without proper safety measures, or anything violating
                local law are not allowed and will be removed.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                6. Respect workers' time
              </h4>

              <p className="text-muted-foreground">
                Be available at the agreed time, or update the worker
                as early as possible if plans change. Repeated
                no-shows or cancellations may affect your posting
                privileges.
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-medium text-foreground">
                7. Rate and review honestly
              </h4>

              <p className="text-muted-foreground">
                Your feedback helps other clients and keeps quality
                high across the platform. Please rate based on your
                actual experience.
              </p>
            </div>

            <p className="pt-1 text-xs text-muted-foreground">
              — End of guidelines —
            </p>
          </div>
        </ScrollArea>

        <Button
          type="button"
          onClick={handleDone}
          disabled={!hasReachedEnd}
          className="w-full"
        >
          <BookOpenCheck className="mr-2 size-4" />

          {hasReachedEnd
            ? "I've read the guidelines"
            : "Scroll to continue"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* 
   MAIN FORM
 */

export function PostWorkForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    userId: "",
    workTitle: "",
    workCategory: "",
    workType: "",
    date: "",
    startDate: "",
    endDate: "",
    time: "",
    duration: "",

    voiceFile: null as MediaItem | null,
    images: [] as MediaItem[],
    videos: [] as MediaItem[],

    description: "",

    budget: "",

    location: "",
    latitude: "",
    longitude: "",

    currentLocation: "",
    manualAddress: "",
    landmark: "",
    contactNumber: "",

    petrolAllowance: "",
    extraRequirements: "",
    anythingElse: "",

    termsAccepted: false,
  })

  const [isLocationDialogOpen, setIsLocationDialogOpen] =
    useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  /*
   * This state belongs to the MAIN FORM.
   * Once the user reads the guidelines completely,
   * this becomes true and enables the checkbox.
   */
  const [hasReadGuidelines, setHasReadGuidelines] =
    useState(false)

  const navigate = useNavigate()

  /* 
     GET USER ID
   */

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (userId) {
      setForm((prev) => ({
        ...prev,
        userId,
      }))
    }
  }, [])

  /* 
     INPUT CHANGE
   */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /* 
     ADDRESS VALUE
   */

  const setValue = (
    name: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /* 
     DATE PARSER
   */

  const parseLocalDate = (value: string) => {
    if (!value) return undefined

    const [year, month, day] = value
      .split("-")
      .map(Number)

    return new Date(
      year,
      month - 1,
      day
    )
  }

  /* 
     VALIDATION
   */

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    /*  STEP 1  */

    if (step === 1) {
      if (!form.workTitle.trim()) {
        newErrors.workTitle =
          "Work title is required"
      } else if (
        !/^.{3,}$/.test(
          form.workTitle.trim()
        )
      ) {
        newErrors.workTitle =
          "Work title must contain at least 3 characters"
      }

      if (!form.workCategory) {
        newErrors.workCategory =
          "Please select a work category"
      }

      if (!form.workType) {
        newErrors.workType =
          "Please select a work duration type"
      }

      if (form.workType === "oneDay") {
        if (!form.date) {
          newErrors.date =
            "Please select a work date"
        }

        if (!form.duration) {
          newErrors.duration =
            "Please select the work duration"
        }
      }

      if (form.workType === "multipleDay") {
        if (!form.startDate) {
          newErrors.startDate =
            "Please select a start date"
        }

        if (!form.endDate) {
          newErrors.endDate =
            "Please select an end date"
        }

        if (
          form.startDate &&
          form.endDate
        ) {
          const startDate =
            parseLocalDate(
              form.startDate
            )

          const endDate =
            parseLocalDate(
              form.endDate
            )

          if (
            startDate &&
            endDate &&
            endDate <= startDate
          ) {
            newErrors.endDate =
              "End date must be after the start date"
          }
        }
      }

      if (!form.time) {
        newErrors.time =
          "Please select a start time"
      }
    }

    /*  STEP 2  */

    if (step === 2) {
      const description =
        form.description.trim()

      const wordCount = description
        .split(/\s+/)
        .filter(Boolean)
        .length

      if (!description) {
        newErrors.description =
          "Please describe your work"
      } else if (
        description.length < 25 &&
        wordCount < 5
      ) {
        newErrors.description =
          "Description must contain at least 25 characters or 5 words"
      }
    }

    /*  STEP 3  */

    if (step === 3) {
      if (!form.budget.trim()) {
        newErrors.budget =
          "Budget is required"
      } else if (
        !/^\d+(\.\d+)?$/.test(
          form.budget.trim()
        )
      ) {
        newErrors.budget =
          "Budget must contain numbers only"
      }

      if (
        form.petrolAllowance.trim()
      ) {
        if (
          !/^\d+(\.\d+)?$/.test(
            form.petrolAllowance.trim()
          )
        ) {
          newErrors.petrolAllowance =
            "Travel allowance must contain numbers only"
        }
      }
    }

    /*  STEP 4  */

    if (step === 4) {
      if (
        !form.latitude ||
        !form.longitude
      ) {
        newErrors.location =
          "Please select a location from the map"
      }

      if (!form.manualAddress.trim()) {
        newErrors.manualAddress =
          "Address details are required"
      } else if (
        form.manualAddress.trim()
          .length < 5
      ) {
        newErrors.manualAddress =
          "Address details must contain at least 5 characters"
      }

      if (
        form.landmark.trim() &&
        form.landmark.trim().length < 2
      ) {
        newErrors.landmark =
          "Landmark must contain at least 2 characters"
      }

      if (!form.contactNumber.trim()) {
        newErrors.contactNumber =
          "Phone number is required"
      }
    }

    /*  STEP 5  */

    if (step === 5) {
      if (!hasReadGuidelines) {
        newErrors.termsAccepted =
          "Please read the posting guidelines first"
      } else if (!form.termsAccepted) {
        newErrors.termsAccepted =
          "You must agree to the terms and conditions"
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  /* 
     SUBMIT
   */

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      if (!form.userId) {
        toast.warning(
          "Please login first."
        )

        navigate(
          AppRoutes.USER.LOGIN
        )

        return
      }

      if (!validateStep(5)) {
        return
      }

      const workData = {
        userId: form.userId,
        workTitle: form.workTitle,
        workCategory: form.workCategory,
        workType: form.workType,

        date:
          form.date || undefined,

        startDate:
          form.startDate || undefined,

        endDate:
          form.endDate || undefined,

        time: form.time,

        description:
          form.description,

        duration:
          form.workType === "oneDay"
            ? form.duration || undefined
            : undefined,

        budget:
          form.budget || undefined,

        latitude:
          Number(form.latitude),

        longitude:
          Number(form.longitude),

        currentLocation:
          form.currentLocation ||
          undefined,

        manualAddress:
          form.manualAddress ||
          undefined,

        landmark:
          form.landmark ||
          undefined,

        contactNumber:
          form.contactNumber,

        petrolAllowance:
          form.petrolAllowance ||
          undefined,

        extraRequirements:
          form.extraRequirements ||
          undefined,

        anythingElse:
          form.anythingElse ||
          undefined,

        termsAccepted:
          form.termsAccepted,

        images:
          form.images,

        videos:
          form.videos,

        voiceFile:
          form.voiceFile,
      }

      const result =
        await WorkService.postWork(
          workData
        )

      console.log(
        "Response:",
        result.data
      )

      if (result.data.success) {
        toast.success(
          "Task successfully submitted!",
          {
            description:
              "We'll connect you with workers soon.",
          }
        )

        navigate(
          AppRoutes.USER.DASHBOARD.MY_WORKS
        )
      }
    } catch (error) {
      console.error(
        "Full error object:",
        error
      )

      console.error(
        "Error response:",
        getErrorMessage(error)
      )

      toast.error(
        `Error submitting task: ${getErrorMessage(
          error
        )}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  /* 
     RENDER
   */

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <CardContent>
        <TaskBookStepper
          initialStep={1}
          onSubmit={handleSubmit}
          onValidateStep={validateStep}
          isSubmitting={isLoading}
          backButtonText="Previous"
          nextButtonText="Next"
        >

          {/* 
              STEP 1
           */}

          <Step>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* LEFT */}

              <div className="flex flex-col gap-4">

                <Field>
                  <FieldLabel htmlFor="workTitle">
                    What is your work
                  </FieldLabel>

                  <Input
                    id="workTitle"
                    name="workTitle"
                    value={form.workTitle}
                    onChange={handleChange}
                    placeholder="E.g., To clean my apartment"
                  />

                  {errors.workTitle && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {errors.workTitle}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="workCategory">
                    Work Category
                  </FieldLabel>

                  <SelectWorkCategory
                    value={form.workCategory}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        workCategory:
                          value,
                      }))
                    }
                  />

                  {errors.workCategory && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {errors.workCategory}
                    </p>
                  )}
                </Field>
              </div>

              {/* RIGHT */}

              <div className="flex flex-col gap-4">

                <Field>
                  <FieldLabel>
                    Select Work Duration Type
                  </FieldLabel>

                  <ToggleGroup
                    type="single"
                    value={form.workType}
                    onValueChange={(value) => {
                      if (!value) return

                      setForm((prev) => ({
                        ...prev,

                        workType:
                          value,

                        date:
                          value ===
                            "oneDay"
                            ? prev.date
                            : "",

                        startDate:
                          value ===
                            "multipleDay"
                            ? prev.startDate
                            : "",

                        endDate:
                          value ===
                            "multipleDay"
                            ? prev.endDate
                            : "",

                        duration:
                          value ===
                            "oneDay"
                            ? prev.duration
                            : "",
                      }))
                    }}
                    className="w-full justify-start"
                  >
                    <ToggleGroupItem
                      value="oneDay"
                      aria-label="Select one day work"
                      className="flex-1 gap-2"
                    >
                      {form.workType ===
                        "oneDay" && (
                          <Check className="size-4" />
                        )}

                      One Day Work
                    </ToggleGroupItem>

                    <ToggleGroupItem
                      value="multipleDay"
                      aria-label="Select multiple day work"
                      className="flex-1 gap-2"
                    >
                      {form.workType ===
                        "multipleDay" && (
                          <Check className="size-4" />
                        )}

                      Multiple Day Work
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {errors.workType && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {errors.workType}
                    </p>
                  )}
                </Field>

                {/* ONE DAY DATE */}

                {form.workType ===
                  "oneDay" && (
                    <Field>
                      <FieldLabel>
                        Work Date
                      </FieldLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.date &&
                              "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />

                            {form.date
                              ? format(
                                parseLocalDate(
                                  form.date
                                )!,
                                "PPP"
                              )
                              : "Select work date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={parseLocalDate(
                              form.date
                            )}
                            onSelect={(date) => {
                              if (!date) return

                              setForm(
                                (prev) => ({
                                  ...prev,
                                  date: format(
                                    date,
                                    "yyyy-MM-dd"
                                  ),
                                })
                              )
                            }}
                            disabled={(date) => {
                              const today =
                                new Date()

                              today.setHours(
                                0,
                                0,
                                0,
                                0
                              )

                              return date < today
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      {errors.date && (
                        <p className="text-[0.7rem] font-medium text-destructive">
                          {errors.date}
                        </p>
                      )}
                    </Field>
                  )}

                {/* ONE DAY DURATION */}

                {form.workType ===
                  "oneDay" && (
                    <Field>
                      <FieldLabel>
                        Work Duration
                      </FieldLabel>

                      <Select
                        value={
                          form.duration
                        }
                        onValueChange={(
                          value
                        ) => {
                          setForm(
                            (prev) => ({
                              ...prev,
                              duration:
                                value,
                            })
                          )
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select work duration" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="30m">
                            Less than 30 minutes
                          </SelectItem>

                          <SelectItem value="45m">
                            Less than 45 minutes
                          </SelectItem>

                          {Array.from(
                            {
                              length: 24,
                            },
                            (_, index) =>
                              index + 1
                          ).map(
                            (hour) => (
                              <SelectItem
                                key={hour}
                                value={`${hour}h`}
                              >
                                {hour}{" "}
                                {hour ===
                                  1
                                  ? "hour"
                                  : "hours"}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>

                      {errors.duration && (
                        <p className="text-[0.7rem] font-medium text-destructive">
                          {errors.duration}
                        </p>
                      )}
                    </Field>
                  )}

                {/* MULTIPLE DAY */}

                {form.workType ===
                  "multipleDay" && (
                    <>
                      <Field>
                        <FieldLabel>
                          Start Date
                        </FieldLabel>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !form.startDate &&
                                "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 size-4" />

                              {form.startDate
                                ? format(
                                  parseLocalDate(
                                    form.startDate
                                  )!,
                                  "PPP"
                                )
                                : "Select start date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={parseLocalDate(
                                form.startDate
                              )}
                              onSelect={(
                                date
                              ) => {
                                if (!date)
                                  return

                                setForm(
                                  (prev) => ({
                                    ...prev,
                                    startDate:
                                      format(
                                        date,
                                        "yyyy-MM-dd"
                                      ),
                                    endDate:
                                      prev.endDate &&
                                        parseLocalDate(
                                          prev.endDate
                                        )! <
                                        date
                                        ? ""
                                        : prev.endDate,
                                  })
                                )
                              }}
                              disabled={(
                                date
                              ) => {
                                const today =
                                  new Date()

                                today.setHours(
                                  0,
                                  0,
                                  0,
                                  0
                                )

                                return (
                                  date <
                                  today
                                )
                              }}
                            />
                          </PopoverContent>
                        </Popover>

                        {errors.startDate && (
                          <p className="text-[0.7rem] font-medium text-destructive">
                            {errors.startDate}
                          </p>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel>
                          End Date
                        </FieldLabel>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !form.endDate &&
                                "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 size-4" />

                              {form.endDate
                                ? format(
                                  parseLocalDate(
                                    form.endDate
                                  )!,
                                  "PPP"
                                )
                                : "Select end date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={parseLocalDate(
                                form.endDate
                              )}
                              onSelect={(
                                date
                              ) => {
                                if (!date)
                                  return

                                setForm(
                                  (prev) => ({
                                    ...prev,
                                    endDate:
                                      format(
                                        date,
                                        "yyyy-MM-dd"
                                      ),
                                  })
                                )
                              }}
                              disabled={(
                                date
                              ) => {
                                const today =
                                  new Date()

                                today.setHours(
                                  0,
                                  0,
                                  0,
                                  0
                                )

                                if (
                                  date <
                                  today
                                ) {
                                  return true
                                }

                                if (
                                  form.startDate
                                ) {
                                  const startDate =
                                    parseLocalDate(
                                      form.startDate
                                    )

                                  if (
                                    startDate
                                  ) {
                                    return (
                                      date <=
                                      startDate
                                    )
                                  }
                                }

                                return false
                              }}
                            />
                          </PopoverContent>
                        </Popover>

                        {errors.endDate && (
                          <p className="text-[0.7rem] font-medium text-destructive">
                            {errors.endDate}
                          </p>
                        )}
                      </Field>
                    </>
                  )}

                {/* TIME */}

                {form.workType && (
                  <Field>
                    <TimePicker
                      className="w-full"
                      openOnFocus
                      value={form.time}
                      onValueChange={(
                        value
                      ) => {
                        setForm(
                          (prev) => ({
                            ...prev,
                            time: value,
                          })
                        )
                      }}
                    >
                      <TimePickerLabel>
                        Time (when to start work)
                      </TimePickerLabel>

                      <TimePickerInputGroup>
                        <TimePickerInput segment="hour" />

                        <TimePickerSeparator />

                        <TimePickerInput segment="minute" />

                        <TimePickerInput segment="period" />

                        <TimePickerTrigger />
                      </TimePickerInputGroup>

                      <TimePickerContent>
                        <TimePickerHour />
                        <TimePickerMinute />
                        <TimePickerPeriod />
                      </TimePickerContent>
                    </TimePicker>
                  </Field>
                )}
              </div>
            </div>
          </Step>

          {/* 
              STEP 2
           */}

          <Step>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="description">
                    Tell about your work
                  </FieldLabel>

                  <Textarea
                    id="description"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Explain what needs to be done..."
                    maxLength={500}
                  />

                  <div className="flex justify-between">
                    {errors.description ? (
                      <span className="text-xs text-destructive">
                        {
                          errors.description
                        }
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="text-xs text-muted-foreground">
                      {500 -
                        form
                          .description
                          .length}{" "}
                      characters remaining
                    </span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>
                    Voice Note, describe your work through a voice note (optional)
                  </FieldLabel>

                  <VoiceRecorder
                    value={
                      form.voiceFile
                    }
                    onChange={(
                      voiceFile
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          voiceFile,
                        })
                      )
                    }
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>
                    Add Images (optional)
                  </FieldLabel>

                  <MediaUploader
                    type="image"
                    max={3}
                    value={
                      form.images
                    }
                    onChange={(
                      images
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          images,
                        })
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Add Video Detail About your work (optional)
                  </FieldLabel>

                  <MediaUploader
                    type="video"
                    max={3}
                    value={
                      form.videos
                    }
                    onChange={(
                      videos
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          videos,
                        })
                      )
                    }
                  />
                </Field>
              </div>
            </div>
          </Step>

          {/* 
              STEP 3
           */}

          <Step>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="budget">
                  Budget ₹
                </FieldLabel>

                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={
                    form.budget
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter estimated budget"
                />

                {errors.budget && (
                  <p className="text-[0.7rem] font-medium text-destructive">
                    {errors.budget}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="petrolAllowance">
                  Travel Allowance if have Per Km (optional)
                </FieldLabel>

                <Input
                  id="petrolAllowance"
                  name="petrolAllowance"
                  type="text"
                  value={
                    form.petrolAllowance
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional extra for travel Eg: 5 rupees per km"
                />

                {errors.petrolAllowance && (
                  <p className="text-[0.7rem] font-medium text-destructive">
                    {
                      errors.petrolAllowance
                    }
                  </p>
                )}
              </Field>
            </FieldGroup>
          </Step>

          {/* 
              STEP 4
           */}

          <Step>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>
                    Location (select from map)
                  </FieldLabel>

                  <Dialog
                    open={
                      isLocationDialogOpen
                    }
                    onOpenChange={
                      setIsLocationDialogOpen
                    }
                  >
                    <DialogTrigger
                      asChild
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {form.location ||
                          "Select a location"}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          Choose a Location
                        </DialogTitle>

                        <DialogDescription>
                          Enter your address for the work site
                        </DialogDescription>
                      </DialogHeader>

                      <AddressAutocomplete
                        setValue={
                          setValue
                        }
                        closeDialog={() =>
                          setIsLocationDialogOpen(
                            false
                          )
                        }
                      />
                    </DialogContent>
                  </Dialog>

                  {errors.location && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {errors.location}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="manualAddress">
                    Address details
                  </FieldLabel>

                  <Textarea
                    id="manualAddress"
                    name="manualAddress"
                    value={
                      form.manualAddress
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Street, city, pincode"
                  />

                  {errors.manualAddress && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {
                        errors.manualAddress
                      }
                    </p>
                  )}
                </Field>
              </div>

              <div className="flex flex-col gap-4">

                <Field>
                  <FieldLabel htmlFor="landmark">
                    Landmark
                  </FieldLabel>

                  <Input
                    id="landmark"
                    name="landmark"
                    value={
                      form.landmark
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Nearby landmark"
                  />

                  {errors.landmark && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {errors.landmark}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="contactNumber">
                    Phone Number
                  </FieldLabel>

                  <PhoneInput
                    id="contactNumber"
                    variant="lg"
                    defaultCountry="IN"
                    value={
                      form.contactNumber
                    }
                    onChange={(
                      value
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          contactNumber:
                            value,
                        })
                      )
                    }
                    placeholder="Enter contact number"
                  />

                  {errors.contactNumber && (
                    <p className="text-[0.7rem] font-medium text-destructive">
                      {
                        errors.contactNumber
                      }
                    </p>
                  )}
                </Field>
              </div>
            </div>
          </Step>

          {/* 
              STEP 5
           */}

          <Step>
            <FieldGroup>

              <Field>
                <FieldLabel htmlFor="extraRequirements">
                  Extra Requirements (optional)
                </FieldLabel>

                <Textarea
                  id="extraRequirements"
                  name="extraRequirements"
                  value={
                    form.extraRequirements
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Have any extra information or something to provide..."
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="anythingElse">
                  Anything Else
                </FieldLabel>

                <Textarea
                  id="anythingElse"
                  name="anythingElse"
                  value={
                    form.anythingElse
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Any other notes for workers"
                />
              </Field>

              {/* 
                  AGREEMENT
               */}


              <div className="flex items-start gap-3">


                <Checkbox
                  id="termsAccepted"
                  checked={form.termsAccepted}
                  disabled={!hasReadGuidelines}
                  onCheckedChange={(checked) => {
                    if (!hasReadGuidelines) return

                    setForm((prev) => ({
                      ...prev,
                      termsAccepted: checked === true,
                    }))

                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.termsAccepted
                      return next
                    })
                  }}
                  className={cn(
                    "mt-0.5 size-5 border-2",
                    "border-foreground/30 bg-background",
                    "data-[state=checked]:border-primary",
                    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                />

                <div className="flex-1 mt-0">

                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <label
                      htmlFor="termsAccepted"
                      className={cn(
                        "text-sm font-medium",
                        hasReadGuidelines
                          ? "cursor-pointer text-foreground"
                          : "cursor-not-allowed text-muted-foreground"
                      )}
                    >
                      I agree to the terms and conditions
                    </label>

                    <span className="text-sm text-muted-foreground">
                      •
                    </span>

                    {/* GUIDELINES LINK */}
                    <PostingGuidelinesDialog
                      hasRead={
                        hasReadGuidelines
                      }
                      onFinishedReading={() => {
                        setHasReadGuidelines(
                          true
                        )

                        /*
                         * Clear the previous validation
                         * error once guidelines are read.
                         */
                        setErrors(
                          (prev) => {
                            const next = {
                              ...prev,
                            }

                            delete next.termsAccepted

                            return next
                          }
                        )
                      }}
                    />
                  </div>

                  {!hasReadGuidelines && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Read the posting guidelines
                      before accepting the terms.
                    </p>
                  )}

                  {errors.termsAccepted && (
                    <p className="mt-1 text-[0.7rem] font-medium text-destructive">
                      {
                        errors.termsAccepted
                      }
                    </p>
                  )}
                </div>
              </div>

            </FieldGroup>
          </Step>

        </TaskBookStepper>
      </CardContent>
    </div>
  )
}