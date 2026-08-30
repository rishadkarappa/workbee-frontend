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
import TaskBookStepper, { Step } from "./task-book-stepper"
import { WorkService } from "@/services/work-service"
import AddressAutocomplete from "./AddressAutocomplete"
import { getErrorMessage } from "@/utils/error-helper"
import { AppRoutes } from "@/constants/routes/app-routes"
import { toast } from "sonner"
import { PhoneInput } from "../ui/phone-input"

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
    description: "",
    voiceFile: null as File | null,
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

      // Add all form fields except latitude, longitude, and location
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'latitude' || key === 'longitude' || key === 'location') {
          return
        }
        if (value === null || value === "") {
          return
        }
        if (value instanceof File) {
          formData.append(key, value)
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString())
        } else {
          formData.append(key, value)
        }
      })


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
                  <FieldLabel htmlFor="workCategory">Work Category</FieldLabel>
                  <Input
                    id="workCategory"
                    name="workCategory"
                    value={form.workCategory}
                    onChange={handleChange}
                    placeholder="E.g., Plumbing, Cleaning"
                    required
                  />
                </Field>
              </div>

              {/* ---------- RIGHT SIDE ---------- */}
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Work Duration Type</FieldLabel>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="workType"
                        value="oneDay"
                        checked={form.workType === "oneDay"}
                        onChange={handleChange}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm">One Day Work</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="workType"
                        value="multipleDay"
                        checked={form.workType === "multipleDay"}
                        onChange={handleChange}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm">Multiple Day Work</span>
                    </label>
                  </div>
                </Field>

                {form.workType === "oneDay" && (
                  <Field>
                    <FieldLabel htmlFor="date">Date</FieldLabel>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                )}

                {form.workType === "multipleDay" && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={handleChange}
                        required
                      />
                    </Field>
                  </>
                )}

                {form.workType && (
                  <Field>
                    <FieldLabel htmlFor="time">Time (when to start work)</FieldLabel>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                    />
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
                  <FieldLabel htmlFor="description">Description about your work (min 30 words)</FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Explain what needs to be done..."
                    required
                  />
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
              <div className="flex flex-col gap-4">
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
