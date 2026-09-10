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
    voiceFile: null as File | null,
    images: [] as MediaItem[],
    videos: [] as MediaItem[],
    description: "",
    videoFile: null as File | null,
    duration: "",
    budget: "",

    location: "", // Display address from map

    latitude: "", // Hidden field
    longitude: "", // Hidden field

    currentLocation: "",
    manualAddress: "",
    landmark: "",
    contactNumber: "",
    beforeImage: null as File | null,
    petrolAllowance: "",
    extraRequirements: "",
    anythingElse: "",
    termsAccepted: false,
  })

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] })
    }
  }

  // Helper function for AddressAutocomplete to update form
  const setValue = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      if (!form.userId) {
        toast.warning("Please login first.")
        navigate(AppRoutes.USER.LOGIN)
        return
      }

      if (!form.workTitle || !form.workCategory || !form.contactNumber) {
        alert("Please fill required fields.")
        return
      }

      if (!form.workType) {
        alert("Please select work duration type (One Day or Multiple Days)")
        return
      }

      if (!form.latitude || !form.longitude) {
        alert("Please select location from map")
        return
      }

      const formData = new FormData()

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'latitude' || key === 'longitude' || key === 'location') return
        if (key === 'images' || key === 'videos') return // handled separately below
        if (value === null || value === "") return
        if (value instanceof File) {
          formData.append(key, value)
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString())
        } else {
          formData.append(key, value as string)
        }
      })

      formData.append('images', JSON.stringify(form.images))
      formData.append('videos', JSON.stringify(form.videos))
      formData.append('latitude', form.latitude)
      formData.append('longitude', form.longitude)

      const result = await WorkService.postWork(formData)

      console.log("Response:", result.data)

      if (result.data.success) {
        toast.success("Task successfully submitted!", {
          description: "We'll connect you with workers soon."
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
                  <FieldLabel htmlFor="workTitle">What is your work</FieldLabel>
                  <Input
                    id="workTitle"
                    name="workTitle"
                    value={form.workTitle}
                    onChange={handleChange}
                    placeholder="E.g., Fix kitchen sink"
                    required
                  />
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
                </Field>
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

                            return date < today
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                                  return date < startDate
                                }
                              }

                              return false
                            }}
                          />
                        </PopoverContent>
                      </Popover>
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
                    required
                  />

                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {500 - form.description.length} characters remaining
                    </span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="voiceFile">Voice Note, describe your work through voice note(optional)</FieldLabel>
                  <Input
                    id="voiceFile"
                    name="voiceFile"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </Field>
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              {/* <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="videoFile">Video, describe your work through video note(optional)</FieldLabel>
                  <Input
                    id="videoFile"
                    name="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="beforeImage">Before Image (optional)</FieldLabel>
                  <Input
                    id="beforeImage"
                    name="beforeImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Field>
              </div> */}
              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Images (up to 3, optional)</FieldLabel>
                  <MediaUploader
                    type="image"
                    max={3}
                    value={form.images}
                    onChange={(images) => setForm(prev => ({ ...prev, images }))}
                  />
                </Field>

                <Field>
                  <FieldLabel>Videos (up to 3, optional)</FieldLabel>
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
                <FieldLabel htmlFor="duration">Duration & Timing(how much times want to complate this word)</FieldLabel>
                <Input
                  id="duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="E.g., 2 hours / 9am to 11am"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="budget">Budget(how much pay for this work)</FieldLabel>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="Enter estimated budget"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="petrolAllowance">Travel Allowance</FieldLabel>
                <Input
                  id="petrolAllowance"
                  name="petrolAllowance"
                  type="text"
                  value={form.petrolAllowance}
                  onChange={handleChange}
                  placeholder="Optional extra for travel"
                />
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
                </Field>

                <Field>
                  <FieldLabel htmlFor="manualAddress">Address details</FieldLabel>
                  <Textarea
                    id="manualAddress"
                    name="manualAddress"
                    value={form.manualAddress}
                    onChange={handleChange}
                    placeholder="Street, city, pincode"
                  />
                </Field>
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="landmark">Landmark</FieldLabel>
                  <Input
                    id="landmark"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="contactNumber">Phone Number</FieldLabel>
                  <PhoneInput
                    id="contactNumber"
                    variant="lg"
                    defaultCountry="IN"
                    value={form.contactNumber}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, contactNumber: value, }))
                    }
                    placeholder="Enter contact number"
                    required
                  />
                </Field>

              </div>
            </div>
          </Step>

          {/* ---------- STEP 5 ---------- */}
          <Step>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="extraRequirements">Extra Requirements</FieldLabel>
                <Textarea
                  id="extraRequirements"
                  name="extraRequirements"
                  value={form.extraRequirements}
                  onChange={handleChange}
                  placeholder="Tools, materials, or worker count etc."
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

              <label className="flex items-center gap-2 mt-3">
                <Checkbox
                  checked={form.termsAccepted}
                  onCheckedChange={() =>
                    setForm({ ...form, termsAccepted: !form.termsAccepted })
                  }
                />
                <span>I agree to the terms and conditions</span>
              </label>
            </FieldGroup>
          </Step>
        </TaskBookStepper>
      </CardContent>
    </div>
  )
}
