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
  DialogTrigger
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Check } from "lucide-react"
import { format } from "date-fns"
import { TimePicker, TimePickerContent, TimePickerHour, TimePickerInput, TimePickerInputGroup, TimePickerLabel, TimePickerMinute, TimePickerPeriod, TimePickerSeparator, TimePickerTrigger } from "@/components/ui/time-picker"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MediaItem } from "@/services/cloudinary-work-media-service"
import { MediaUploader } from "./components/media-uploader"
import { VoiceRecorder } from "./components/voice-recorder"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PostWorkForm({ className, ...props }: React.ComponentProps<"div">) {

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

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // const [durationUnit, setDurationUnit] = useState<"minutes" | "hours">("hours")

  const navigate = useNavigate()

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (userId) {
      setForm(prev => ({ ...prev, userId }))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  // Helper function for AddressAutocomplete to update form
  const setValue = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  //validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    // STEP 1
    if (step === 1) {
      if (!form.workTitle.trim()) {
        newErrors.workTitle = "Work title is required"
      } else if (!/^.{3,}$/.test(form.workTitle.trim())) {
        newErrors.workTitle = "Work title must contain at least 3 characters"
      }

      if (!form.workCategory) {
        newErrors.workCategory = "Please select a work category"
      }

      if (!form.workType) {
        newErrors.workType = "Please select a work duration type"
      }

      if (form.workType === "oneDay") {
        if (!form.date) {
          newErrors.date = "Please select a work date"
        }

        // Work duration only applies to one-day work
        if (!form.duration) {
          newErrors.duration = "Please select the work duration"
        }
      }

      if (form.workType === "multipleDay") {
        if (!form.startDate) {
          newErrors.startDate = "Please select a start date"
        }

        if (!form.endDate) {
          newErrors.endDate = "Please select an end date"
        }

        if (form.startDate && form.endDate) {
          const startDate = parseLocalDate(form.startDate)
          const endDate = parseLocalDate(form.endDate)

          if (startDate && endDate && endDate <= startDate) {
            newErrors.endDate = "End date must be after the start date"
          }
        }
      }

      if (!form.time) {
        newErrors.time = "Please select a start time"
      }
    }

    // STEP 2
    if (step === 2) {
      const description = form.description.trim()
      const wordCount = description
        .split(/\s+/)
        .filter(Boolean)
        .length

      if (!description) {
        newErrors.description = "Please describe your work"
      } else if (description.length < 25 && wordCount < 5) {
        newErrors.description =
          "Description must contain at least 25 characters or 5 words"
      }
    }

    // STEP 3
    if (step === 3) {
      // Budget - required, numbers only
      if (!form.budget.trim()) {
        newErrors.budget = "Budget is required"
      } else if (!/^\d+(\.\d+)?$/.test(form.budget.trim())) {
        newErrors.budget = "Budget must contain numbers only"
      }

      // Travel allowance - optional, but numbers only if provided
      if (form.petrolAllowance.trim()) {
        if (!/^\d+(\.\d+)?$/.test(form.petrolAllowance.trim())) {
          newErrors.petrolAllowance =
            "Travel allowance must contain numbers only"
        }
      }
    }

    // STEP 4
    if (step === 4) {
      if (!form.latitude || !form.longitude) {
        newErrors.location = "Please select a location from the map"
      }

      if (!form.manualAddress.trim()) {
        newErrors.manualAddress = "Address details are required"
      } else if (form.manualAddress.trim().length < 5) {
        newErrors.manualAddress =
          "Address details must contain at least 5 characters"
      }

      if (form.landmark.trim() && form.landmark.trim().length < 2) {
        newErrors.landmark = "Landmark must contain at least 2 characters"
      }

      if (!form.contactNumber.trim()) {
        newErrors.contactNumber = "Phone number is required"
      }
    }

    // STEP 5
    if (step === 5) {
      if (!form.termsAccepted) {
        newErrors.termsAccepted =
          "You must agree to the terms and conditions"
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      if (!form.userId) {
        toast.warning("Please login first.")
        navigate(AppRoutes.USER.LOGIN)
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
        date: form.date || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        time: form.time,
        description: form.description,
        duration: form.workType === "oneDay" ? (form.duration || undefined) : undefined,
        budget: form.budget || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        currentLocation: form.currentLocation || undefined,
        manualAddress: form.manualAddress || undefined,
        landmark: form.landmark || undefined,
        contactNumber: form.contactNumber,
        petrolAllowance: form.petrolAllowance || undefined,
        extraRequirements: form.extraRequirements || undefined,
        anythingElse: form.anythingElse || undefined,
        termsAccepted: form.termsAccepted,
        images: form.images,
        videos: form.videos,
        voiceFile: form.voiceFile,
      }

      const result = await WorkService.postWork(workData)

      console.log("Response:", result.data)

      if (result.data.success) {
        toast.success("Task successfully submitted!", {
          description: "We'll connect you with workers soon.",
        })

        navigate(AppRoutes.USER.DASHBOARD.MY_WORKS)
      }
    } catch (error) {
      console.error("Full error object:", error)
      console.error("Error response:", getErrorMessage(error))

      toast.error(`Error submitting task: ${getErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const parseLocalDate = (value: string) => {
    if (!value) return undefined

    const [year, month, day] = value.split("-").map(Number)

    return new Date(year, month - 1, day)
  }


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardContent>

        <TaskBookStepper
          initialStep={1}
          onSubmit={handleSubmit}
          onValidateStep={validateStep}
          isSubmitting={isLoading}
          backButtonText="Previous"
          nextButtonText="Next"
        >
          {/* ---------- STEP 1 ---------- */}
          <Step>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ---------- LEFT SIDE ---------- */}
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
                    placeholder="E.g., Fix kitchen sink"
                  />

                  {errors.workTitle && (
                    <p className="text-[0.7rem] font-sm text-destructive">
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
                        workCategory: value,
                      }))
                    }
                  />

                  {errors.workCategory && (
                    <p className="text-[0.7rem] font-sm text-destructive">
                      {errors.workCategory}
                    </p>
                  )}
                </Field>

                {/* work duration */}
                {/* {form.workType === "oneDay" && (
                  <Field>
                    <FieldLabel>Work Duration</FieldLabel>

                    <Select
                      value={form.duration}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          duration: value,
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select work duration" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="30m">
                          30 minutes
                        </SelectItem>

                        <SelectItem value="45m">
                          45 minutes
                        </SelectItem>

                        {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                          <SelectItem key={hour} value={`${hour}h`}>
                            {hour} {hour === 1 ? "hour" : "hours"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.duration && (
                      <p className="text-[0.7rem] font-medium text-red-500">
                        {errors.duration}
                      </p>
                    )}
                  </Field>
                )} */}
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">

                <Field>
                  <FieldLabel>Select Work Duration Type</FieldLabel>

                  <ToggleGroup
                    type="single"
                    value={form.workType}
                    onValueChange={(value) => {
                      if (!value) return

                      setForm((prev) => ({
                        ...prev,
                        workType: value,
                        date: value === "oneDay" ? prev.date : "",
                        startDate: value === "multipleDay" ? prev.startDate : "",
                        endDate: value === "multipleDay" ? prev.endDate : "",
                        duration: value === "oneDay" ? prev.duration : "",
                      }))
                    }}
                    className="w-full justify-start"
                  >
                    <ToggleGroupItem
                      value="oneDay"
                      aria-label="Select one day work"
                      className="flex-1 gap-2"
                    >
                      {form.workType === "oneDay" && (
                        <Check className="size-4" />
                      )}
                      One Day Work
                    </ToggleGroupItem>

                    <ToggleGroupItem
                      value="multipleDay"
                      aria-label="Select multiple day work"
                      className="flex-1 gap-2"
                    >
                      {form.workType === "multipleDay" && (
                        <Check className="size-4" />
                      )}
                      Multiple Day Work
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {errors.workType && (
                    <p className="text-[0.7rem] font-sm text-destructive">
                      {errors.workType}
                    </p>
                  )}
                </Field>

                {form.workType === "oneDay" && (

                  <Field>
                    <FieldLabel>Work Date</FieldLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />

                          {form.date
                            ? format(parseLocalDate(form.date)!, "PPP")
                            : "Select work date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseLocalDate(form.date)}
                          onSelect={(date) => {
                            if (!date) return

                            setForm((prev) => ({
                              ...prev,
                              date: format(date, "yyyy-MM-dd"),
                            }))
                          }}

                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)

                            if (date < today) return true

                            if (form.startDate) {
                              const startDate = parseLocalDate(form.startDate)

                              if (startDate) {
                                return date <= startDate
                              }
                            }

                            return false
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && (
                      <p className="text-[0.7rem] font-sm text-destructive">
                        {errors.date}
                      </p>
                    )}
                  </Field>

                )}

                {/* work duration */}
                {form.workType === "oneDay" && (
                  <Field>
                    <FieldLabel>Work Duration</FieldLabel>

                    <Select
                      value={form.duration}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          duration: value,
                        }))
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

                        {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                          <SelectItem key={hour} value={`${hour}h`}>
                            {hour} {hour === 1 ? "hour" : "hours"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.duration && (
                      <p className="text-[0.7rem] font-medium text-red-500">
                        {errors.duration}
                      </p>
                    )}
                  </Field>
                )}

                {form.workType === "multipleDay" && (
                  <>

                    <Field>
                      <FieldLabel>Start Date</FieldLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />

                            {form.startDate
                              ? format(parseLocalDate(form.startDate)!, "PPP")
                              : "Select start date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseLocalDate(form.startDate)}
                            onSelect={(date) => {
                              if (!date) return

                              setForm((prev) => ({
                                ...prev,
                                startDate: format(date, "yyyy-MM-dd"),
                                endDate:
                                  prev.endDate &&
                                    parseLocalDate(prev.endDate)! < date
                                    ? ""
                                    : prev.endDate,
                              }))
                            }}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)

                              return date < today
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.startDate && (
                        <p className="text-[0.7rem] font-sm text-destructive">
                          {errors.startDate}
                        </p>
                      )}
                    </Field>


                    <Field>
                      <FieldLabel>End Date</FieldLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />

                            {form.endDate
                              ? format(parseLocalDate(form.endDate)!, "PPP")
                              : "Select end date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseLocalDate(form.endDate)}
                            onSelect={(date) => {
                              if (!date) return

                              setForm((prev) => ({
                                ...prev,
                                endDate: format(date, "yyyy-MM-dd"),
                              }))
                            }}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)

                              if (date < today) return true

                              if (form.startDate) {
                                const startDate = parseLocalDate(form.startDate)

                                if (startDate) {
                                  return date <= startDate
                                }
                              }

                              return false
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.endDate && (
                        <p className="text-[0.7rem] font-sm text-destructive">
                          {errors.endDate}
                        </p>
                      )}
                    </Field>
                  </>
                )}

                {form.workType && (

                  <Field>
                    <TimePicker
                      className="w-full"
                      openOnFocus
                      value={form.time}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          time: value,
                        }))
                      }}
                    >
                      <TimePickerLabel>Time (when to start work)</TimePickerLabel>

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

          {/* ---------- STEP 2 ---------- */}
          <Step>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ---------- LEFT SIDE ---------- */}
              <div className="flex flex-col gap-4">


                <Field>
                  <FieldLabel htmlFor="description">
                    Tell about your work
                  </FieldLabel>

                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Explain what needs to be done..."
                    maxLength={500}
                  />

                  <div className="flex justify-between">
                    {errors.description ? (
                      <span className="text-xs text-destructive">
                        {errors.description}
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="text-xs text-muted-foreground">
                      {500 - form.description.length} characters remaining
                    </span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Voice Note, describe your work through a voice note (optional)</FieldLabel>
                  <VoiceRecorder
                    value={form.voiceFile}
                    onChange={(voiceFile) => setForm(prev => ({ ...prev, voiceFile }))}
                  />
                </Field>
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Add Images (optional)</FieldLabel>
                  <MediaUploader
                    type="image"
                    max={3}
                    value={form.images}
                    onChange={(images) => setForm(prev => ({ ...prev, images }))}
                  />
                </Field>

                <Field>
                  <FieldLabel>Add Video Detail About your work (optional)</FieldLabel>
                  <MediaUploader
                    type="video"
                    max={3}
                    value={form.videos}
                    onChange={(videos) => setForm(prev => ({ ...prev, videos }))}
                  />
                </Field>
              </div>
            </div>
          </Step>

          {/* ---------- STEP 3 ---------- */}

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
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="Enter estimated budget"
                />

                {errors.budget && (
                  <p className="text-[0.7rem] font-sm text-destructive">
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
                  value={form.petrolAllowance}
                  onChange={handleChange}
                  placeholder="Optional extra for travel"
                />

                {errors.petrolAllowance && (
                  <p className="text-[0.7rem] font-sm text-destructive">
                    {errors.petrolAllowance}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </Step>

          {/* ---------- STEP 4 ---------- */}
          <Step>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ---------- LEFT SIDE ---------- */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Location (select from map)</FieldLabel>
                  <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {form.location || "Select a location"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Choose a Location</DialogTitle>
                        <DialogDescription>
                          Enter your address for the work site
                        </DialogDescription>
                      </DialogHeader>
                      <AddressAutocomplete
                        setValue={setValue}
                        closeDialog={() => setIsLocationDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  {errors.location && (
                    <p className="text-[0.7rem] font-sm text-destructive">
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
                    value={form.manualAddress}
                    onChange={handleChange}
                    placeholder="Street, city, pincode"
                  />

                  {errors.manualAddress && (
                    <p className="text-[0.7rem] font-sm text-destructive">
                      {errors.manualAddress}
                    </p>
                  )}
                </Field>
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">

                <Field>
                  <FieldLabel htmlFor="landmark">
                    Landmark
                  </FieldLabel>

                  <Input
                    id="landmark"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                  />

                  {errors.landmark && (
                    <p className="text-[0.7rem] font-sm text-destructive">
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
                    value={form.contactNumber}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        contactNumber: value,
                      }))
                    }
                    placeholder="Enter contact number"
                  />

                  {errors.contactNumber && (
                    <p className="text-[0.7rem] font-sm text-destructive">
                      {errors.contactNumber}
                    </p>
                  )}
                </Field>

              </div>
            </div>
          </Step>

          {/* ---------- STEP 5 ---------- */}
          <Step>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="extraRequirements">Extra Requirements (optional)</FieldLabel>
                <Textarea
                  id="extraRequirements"
                  name="extraRequirements"
                  value={form.extraRequirements}
                  onChange={handleChange}
                  placeholder="Have any extra information or somethings to provide.."
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="anythingElse">Anything Else</FieldLabel>
                <Textarea
                  id="anythingElse"
                  name="anythingElse"
                  value={form.anythingElse}
                  onChange={handleChange}
                  placeholder="Any other notes for workers"
                />
              </Field>


              <label className="flex items-start gap-2 mt-3">
                <Checkbox
                  checked={form.termsAccepted}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      termsAccepted: checked === true,
                    }))
                  }
                />

                <div>
                  <span>I agree to the terms and conditions</span>

                  {errors.termsAccepted && (
                    <p className="text-[0.7rem] font-sm text-destructive">
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>
              </label>
            </FieldGroup>
          </Step>
        </TaskBookStepper>
      </CardContent>
    </div>
  )
}