import { cn } from "@/lib/utils"
import Stepper, { Step } from "./stepper"
import { CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { PhoneInput } from "@/components/ui/phone-input"
import { isValidPhoneNumber } from "react-phone-number-input"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { WorkService } from "@/services/work-service"
import { getErrorMessage } from "@/utils/error-helper"

export interface WorkerConfirmationsDto {
  reliable: boolean;
  experienced: boolean;
  honest: boolean;
  termsAccepted: boolean;
}

export interface ApplyForWorkerDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  workType: string;
  preferredWorks: string[];
  confirmations: WorkerConfirmationsDto;
}

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  location?: string;
  workType?: string;
  preferredWork?: string;
  confirmations?: string;
}

export function ApplyWorkerForm({ className, ...props }: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: undefined as string | undefined,
    password: "",
    confirmPassword: "",
    location: "",
    workType: "",
    preferredWork: "",
    confirmations: {
      reliable: false,
      experienced: false,
      honest: false,
      termsAccepted: false,
    },
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
    }
  }

  const handlePhoneChange = (value: string | undefined) => {
    setForm((prev) => ({ ...prev, phone: value }))
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }))
    }
  }

  const handleCheckbox = (name: string) => {
    setForm((prev) => ({
      ...prev,
      confirmations: {
        ...prev.confirmations,
        [name]: !prev.confirmations[name as keyof typeof prev.confirmations],
      },
    }))
    if (errors.confirmations) {
      setErrors((prev) => ({ ...prev, confirmations: undefined }))
    }
  }

  // ---------- Per-step validators ----------

  const validateStep1 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.name.trim()) {
      stepErrors.name = "Full name is required"
    }

    if (!form.email.trim()) {
      stepErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      stepErrors.email = "Enter a valid email address"
    }

    if (!form.phone) {
      stepErrors.phone = "Phone number is required"
    } else if (!isValidPhoneNumber(form.phone)) {
      stepErrors.phone = "Enter a valid phone number"
    }

    setErrors((prev) => ({ ...prev, name: undefined, email: undefined, phone: undefined, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.password) {
      stepErrors.password = "Password is required"
    } else if (form.password.length < 6) {
      stepErrors.password = "Password must be at least 6 characters"
    }

    if (!form.confirmPassword) {
      stepErrors.confirmPassword = "Please confirm your password"
    } else if (form.password !== form.confirmPassword) {
      stepErrors.confirmPassword = "Passwords do not match"
    }

    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.location.trim()) {
      stepErrors.location = "Location is required"
    }
    if (!form.workType.trim()) {
      stepErrors.workType = "Work type is required"
    }
    if (!form.preferredWork.trim()) {
      stepErrors.preferredWork = "Preferred work is required"
    }

    setErrors((prev) => ({ ...prev, location: undefined, workType: undefined, preferredWork: undefined, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  const validateStep4 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.confirmations.reliable || !form.confirmations.honest || !form.confirmations.termsAccepted) {
      stepErrors.confirmations = "Please confirm all the required statements."
    }

    setErrors((prev) => ({ ...prev, confirmations: undefined, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  // Dispatcher — passed to Stepper, called on every "Next"/"Apply" click
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: return validateStep1()
      case 2: return validateStep2()
      case 3: return validateStep3()
      case 4: return validateStep4()
      default: return true
    }
  }

  const validateAll = (): boolean => {
    const v1 = validateStep1()
    const v2 = validateStep2()
    const v3 = validateStep3()
    const v4 = validateStep4()
    return v1 && v2 && v3 && v4
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!validateAll()) {
        return;
      }

      const workerData: ApplyForWorkerDto = {
        name: form.name,
        email: form.email,
        phone: form.phone ?? "",
        password: form.password,
        location: form.location,
        workType: form.workType,
        preferredWorks: [form.preferredWork],
        confirmations: {
          reliable: form.confirmations.reliable,
          experienced: form.confirmations.experienced,
          honest: form.confirmations.honest,
          termsAccepted: form.confirmations.termsAccepted,
        }
      };
      const result = await WorkService.applyForWorker(workerData);

      console.log("Application result:", result);

      if (result.data.success) {
        alert("Successfully applied! Check your email. We'll update you within 1 hour.");
        navigate('/');
      } else {
        alert(result.data.message || "Application failed");
      }
    } catch (error) {
      console.error(getErrorMessage(error));

      const errorMessage = getErrorMessage(error) ||
        "Error while applying to become a worker. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardContent>
        <Stepper
          initialStep={1}
          onStepChange={() => {}}
          onSubmit={handleSubmit}
          onValidateStep={validateStep}
          isSubmitting={isLoading}
          backButtonText="Previous"
          nextButtonText="Next"
        >
          {/* ---------- STEP 1 ---------- */}
          <Step>
            <form className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    aria-invalid={!!errors.name}
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    aria-invalid={!!errors.email}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <PhoneInput
                    id="phone"
                    variant="lg"
                    placeholder="Enter phone number"
                    defaultCountry="IN"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </Step>

          {/* ---------- STEP 2 ---------- */}
          <Step>
            <form className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      aria-invalid={!!errors.password}
                      className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      aria-invalid={!!errors.confirmPassword}
                      className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </Step>

          {/* ---------- STEP 3 ---------- */}
          <Step>
            <form className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="City / State / Country"
                    aria-invalid={!!errors.location}
                    className={errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">{errors.location}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="workType">Work Type</FieldLabel>
                  <Input
                    id="workType"
                    name="workType"
                    value={form.workType}
                    onChange={handleChange}
                    placeholder="E.g., Electrician, Plumber, etc."
                    aria-invalid={!!errors.workType}
                    className={errors.workType ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.workType && (
                    <p className="text-xs text-red-500 mt-1">{errors.workType}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="preferredWork">Preferred Work</FieldLabel>
                  <Input
                    id="preferredWork"
                    name="preferredWork"
                    value={form.preferredWork}
                    onChange={handleChange}
                    placeholder="Your preferred work type"
                    aria-invalid={!!errors.preferredWork}
                    className={errors.preferredWork ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.preferredWork && (
                    <p className="text-xs text-red-500 mt-1">{errors.preferredWork}</p>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </Step>

          {/* ---------- STEP 4 ---------- */}
          <Step>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium mb-2">Confirm the following:</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.confirmations.reliable}
                    onCheckedChange={() => handleCheckbox("reliable")}
                  />
                  <span>I am a reliable worker</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.confirmations.experienced}
                    onCheckedChange={() => handleCheckbox("experienced")}
                  />
                  <span>I have experience in my chosen work type</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.confirmations.honest}
                    onCheckedChange={() => handleCheckbox("honest")}
                  />
                  <span>I promise to complete assigned work honestly</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.confirmations.termsAccepted}
                    onCheckedChange={() => handleCheckbox("termsAccepted")}
                  />
                  <span>I agree to the terms and conditions</span>
                </label>
              </div>
              {errors.confirmations && (
                <p className="text-xs text-red-500">{errors.confirmations}</p>
              )}
            </div>
          </Step>
        </Stepper>
      </CardContent>
    </div>
  )
}