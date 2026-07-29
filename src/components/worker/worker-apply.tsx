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

export function ApplyWorkerForm({ className, ...props }: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCheckbox = (name: string) => {
    setForm((prev) => ({
      ...prev,
      confirmations: {
        ...prev.confirmations,
        [name]: !prev.confirmations[name as keyof typeof prev.confirmations],
      },
    }))
  }


  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validation
      if (!form.name || !form.email || !form.phone) {
        alert("Please fill all required details.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      if (form.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      // Check all confirmations
      if (!form.confirmations.reliable ||
        !form.confirmations.honest ||
        !form.confirmations.termsAccepted) {
        alert("Please confirm all the required statements.");
        return;
      }

      const workerData: ApplyForWorkerDto = {
        name: form.name,
        email: form.email,
        phone: form.phone,
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
                    required
                  />
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
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
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
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="************"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="************"
                    required
                  />
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
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="workType">Work Type</FieldLabel>
                  <Input
                    id="workType"
                    name="workType"
                    value={form.workType}
                    onChange={handleChange}
                    placeholder="E.g., Electrician, Plumber, etc."
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="preferredWork">Preferred Work</FieldLabel>
                  <Input
                    id="preferredWork"
                    name="preferredWork"
                    value={form.preferredWork}
                    onChange={handleChange}
                    placeholder="Your preferred work type"
                    required
                  />
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
                    required
                  />
                  <span>I agree to the terms and conditions</span>
                </label>
              </div>
            </div>
          </Step>
        </Stepper>
      </CardContent>
    </div>
  )
}