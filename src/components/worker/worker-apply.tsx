import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import Stepper, { Step } from "./stepper"
import { CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PhoneInput } from "@/components/ui/phone-input"
import { isValidPhoneNumber } from "react-phone-number-input"
import {
  Eye,
  EyeOff,
  ChevronsUpDown,
  Check,
  X,
  PlusCircle,
  Tag,
  Wrench,
  Tv,
  Truck,
  Hammer,
  PaintRoller,
  TreePine,
  Sparkles,
  Zap,
  Droplets,
  Package,
  Car,
  Boxes,
  Refrigerator,
  Bug,
  Sofa,
  ShoppingCart,
  Trash2,
  Leaf,
  SprayCan,
  Layers,
  Dog,
  Key,
  Lock,
  Shirt,
  Wind,
  PackageCheck,
  ShieldCheck,
  Drill,
  Waves,
  Scissors,
  Utensils,
  ChefHat,
  Bike,
  Camera,
  Music,
  Flower2,
  HardHat,
  Smartphone,
  Laptop,
  Baby,
  HeartHandshake,
  GraduationCap,
  BatteryCharging,
  Antenna,
  Milk,
  Newspaper,
  Fan,
  Building2,
  type LucideIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { WorkService } from "@/services/work-service"
import { getErrorMessage } from "@/utils/error-helper"
import { toast } from "sonner"
import { emailRegex } from "@/constants/regex/regex"

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
  workTypes: string[];
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

// ---------- TaskRabbit + India-local option lists ----------

interface SelectOption {
  value: string
  label: string
  icon: LucideIcon
}

const WORK_TYPE_OPTIONS: SelectOption[] = [
  { value: "furniture-assembly", label: "Furniture Assembly", icon: Wrench },
  { value: "mounting-installation", label: "Mounting & Installation", icon: Tv },
  { value: "moving-help", label: "Moving Help", icon: Truck },
  { value: "home-repairs", label: "Home Repairs", icon: Hammer },
  { value: "painting", label: "Painting", icon: PaintRoller },
  { value: "outdoor-help", label: "Outdoor Help", icon: TreePine },
  { value: "cleaning", label: "Cleaning", icon: Sparkles },
  { value: "electrical-help", label: "Electrical Help", icon: Zap },
  { value: "plumbing-help", label: "Plumbing Help", icon: Droplets },
  { value: "delivery", label: "Delivery", icon: Package },
  { value: "tailoring-stitching", label: "Tailoring & Stitching", icon: Scissors },
  { value: "cooking-catering", label: "Cooking & Catering", icon: ChefHat },
  { value: "tutoring", label: "Tutoring", icon: GraduationCap },
  { value: "beauty-salon", label: "Beauty & Salon", icon: Flower2 },
  { value: "vehicle-repair", label: "Vehicle Repair", icon: Bike },
  { value: "electronics-repair", label: "Electronics Repair", icon: Smartphone },
  { value: "pooja-rituals", label: "Pooja & Rituals", icon: Flower2 },
  { value: "event-services", label: "Event Services", icon: Music },
  { value: "security-services", label: "Security Services", icon: ShieldCheck },
  { value: "caregiving", label: "Caregiving", icon: HeartHandshake },
]

export const PREFERRED_WORK_OPTIONS: SelectOption[] = [
  // Cleaning & Home Maintenance
  { value: "tank-cleaning", label: "Tank Cleaning", icon: Droplets },
  { value: "car-washing", label: "Car Washing", icon: Car },
  { value: "bike-washing", label: "Bike Washing", icon: Bike },
  { value: "house-cleaning", label: "House Cleaning", icon: Sparkles },
  { value: "deep-cleaning", label: "Deep Cleaning", icon: SprayCan },
  { value: "window-cleaning", label: "Window Cleaning", icon: Sparkles },
  { value: "carpet-cleaning", label: "Carpet Cleaning", icon: Sofa },
  { value: "laundry-ironing", label: "Laundry & Ironing", icon: Shirt },
  { value: "gutter-cleaning", label: "Gutter Cleaning", icon: Waves },
  { value: "borewell-tank-service", label: "Borewell & Water Tank Service", icon: Waves },

  // Moving & Assembly
  { value: "flat-moving", label: "Flat Moving", icon: Truck },
  { value: "furniture-assembly", label: "Furniture Assembly", icon: Wrench },
  { value: "heavy-lifting", label: "Heavy Lifting", icon: Layers },
  { value: "packing-unpacking", label: "Packing & Unpacking", icon: Boxes },
  { value: "junk-removal", label: "Junk Removal", icon: Trash2 },

  // Repairs & Technical Services
  { value: "handyman-services", label: "Handyman Services", icon: Hammer },
  { value: "tv-mounting", label: "TV Mounting", icon: Tv },
  { value: "electrical-repairs", label: "Electrical Repairs", icon: Zap },
  { value: "plumbing-repairs", label: "Plumbing Repairs", icon: Droplets },
  { value: "appliance-installation", label: "Appliance Installation", icon: Refrigerator },
  { value: "ac-repair-maintenance", label: "AC Repair & Service", icon: Wind },
  { value: "cooler-fan-repair", label: "Cooler & Fan Repair", icon: Fan },
  { value: "ro-water-purifier-service", label: "RO Water Purifier Service", icon: Droplets },
  { value: "inverter-battery-repair", label: "Inverter & Battery Repair", icon: BatteryCharging },
  { value: "dth-antenna-installation", label: "DTH & Dish Antenna Installation", icon: Antenna },
  { value: "locksmith-services", label: "Locksmith Services", icon: Lock },
  { value: "carpentry", label: "Carpentry & Drilling", icon: Drill },
  { value: "welding-work", label: "Welding Work", icon: HardHat },
  { value: "false-ceiling-pop", label: "False Ceiling / POP Work", icon: Building2 },
  { value: "tiles-flooring", label: "Tiles & Flooring", icon: Layers },
  { value: "waterproofing", label: "Waterproofing", icon: Droplets },
  { value: "painting", label: "Painting", icon: PaintRoller },
  { value: "mobile-repair", label: "Mobile Repair", icon: Smartphone },
  { value: "laptop-computer-repair", label: "Laptop & Computer Repair", icon: Laptop },
  { value: "two-wheeler-repair", label: "Two-Wheeler / Bike Repair", icon: Bike },
  { value: "cctv-smart-home-setup", label: "Smart Home & CCTV Setup", icon: ShieldCheck },

  // Outdoor & Gardening
  { value: "yard-work", label: "Yard Work", icon: Leaf },
  { value: "gardening", label: "Gardening", icon: TreePine },
  { value: "pest-control", label: "Pest Control", icon: Bug },

  // Errands & Delivery
  { value: "grocery-shopping", label: "Grocery Shopping", icon: ShoppingCart },
  { value: "parcel-delivery", label: "Delivery & Pickups", icon: PackageCheck },
  { value: "line-waiting", label: "Waiting in Line", icon: Key },
  { value: "milk-delivery", label: "Milk Delivery", icon: Milk },
  { value: "newspaper-delivery", label: "Newspaper Delivery", icon: Newspaper },

  // Home services popular in India
  { value: "cook-at-home", label: "Cook at Home", icon: ChefHat },
  { value: "tailoring-stitching", label: "Tailoring & Stitching", icon: Scissors },
  { value: "home-tuition", label: "Home Tuition / Tutor", icon: GraduationCap },
  { value: "salon-at-home", label: "Salon at Home", icon: Scissors },
  { value: "mehendi-artist", label: "Mehendi Artist", icon: Flower2 },
  { value: "makeup-artist", label: "Makeup Artist", icon: Flower2 },
  { value: "pooja-priest-services", label: "Pooja / Priest Services", icon: Flower2 },
  { value: "catering-services", label: "Catering Services", icon: Utensils },
  { value: "dj-sound-system", label: "DJ & Sound System", icon: Music },
  { value: "photography-videography", label: "Photography & Videography", icon: Camera },
  { value: "babysitting-nanny", label: "Babysitting / Nanny", icon: Baby },
  { value: "elderly-care", label: "Elderly Care", icon: HeartHandshake },
  { value: "pet-sitting-walking", label: "Pet Sitting & Walking", icon: Dog },
  { value: "security-guard-services", label: "Security Guard Services", icon: ShieldCheck },
]

// ---------- Reusable creatable multi-select ----------

interface MultiSelectProps {
  options: SelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  customOptions?: SelectOption[]
  onCreateOption?: (option: SelectOption) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  error?: boolean
}

function slugify(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || text.trim()
  )
}

function MultiSelect({
  options,
  selected,
  onChange,
  customOptions = [],
  onCreateOption,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  error,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const allOptions = [...options, ...customOptions]

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeOption = (value: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const trimmedSearch = search.trim()
  const exactMatch = allOptions.some(
    (o) => o.label.toLowerCase() === trimmedSearch.toLowerCase()
  )
  const canCreate = !!onCreateOption && trimmedSearch.length > 0 && !exactMatch

  const handleCreate = () => {
    if (!canCreate) return
    const value = slugify(trimmedSearch)
    onCreateOption!({ value, label: trimmedSearch, icon: Tag })
    if (!selected.includes(value)) {
      onChange([...selected, value])
    }
    setSearch("")
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error}
            className={cn(
              "w-full justify-between font-normal h-auto min-h-10 py-2",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {allOptions.length === 0 && !canCreate && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              <CommandGroup>
                {allOptions.map((option) => {
                  const isSelected = selected.includes(option.value)
                  const Icon = option.icon
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => toggleOption(option.value)}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{option.label}</span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {canCreate && (
                <CommandGroup heading="Don't see it?">
                  <CommandItem
                    value={`__create__${trimmedSearch}`}
                    onSelect={handleCreate}
                  >
                    <PlusCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                    Add "{trimmedSearch}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => {
            const option = allOptions.find((o) => o.value === value)
            const Icon = option?.icon ?? Tag
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1 pl-2 pr-1 py-1"
              >
                <Icon className="h-3 w-3" />
                {option?.label ?? value}
                <button
                  type="button"
                  onClick={(e) => removeOption(value, e)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  aria-label={`Remove ${option?.label ?? value}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Worker agreement scroll block ----------

interface WorkerAgreementScrollProps {
  agreed: boolean
  onToggle: () => void
  error?: string
}

function WorkerAgreementScroll({ agreed, onToggle, error }: WorkerAgreementScrollProps) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollAreaRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]"
    )
    if (!viewport) return

    const checkScrolled = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport
      if (scrollHeight - clientHeight <= 0 || scrollTop + clientHeight >= scrollHeight - 8) {
        setHasScrolledToEnd(true)
      }
    }

    viewport.addEventListener("scroll", checkScrolled)
    const resizeObserver = new ResizeObserver(checkScrolled)
    resizeObserver.observe(viewport)
    const raf = requestAnimationFrame(checkScrolled)

    return () => {
      viewport.removeEventListener("scroll", checkScrolled)
      resizeObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium">Worker Agreement</h3>
        <p className="text-sm text-muted-foreground">
          Please read the full agreement below. You'll be able to accept once you've read to the end.
        </p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="h-56 rounded-md border">
        <div className="flex flex-col gap-3 text-sm leading-relaxed p-4">
          <p>
            By checking this box, I confirm that I am a qualified, reliable worker
            with verified experience in my field. I commit to completing all
            accepted tasks safely, honestly, and to the best of my ability, while
            keeping all client communications on-platform and fully abiding by the
            Terms &amp; Conditions.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>
              <span className="font-medium text-foreground">Punctuality &amp; Reliability:</span>{" "}
              I agree to show up on time for scheduled bookings or notify clients
              promptly if an issue arises.
            </li>
            <li>
              <span className="font-medium text-foreground">Platform Safety:</span>{" "}
              I agree to conduct all payment transactions and project discussions
              strictly within the app.
            </li>
            <li>
              <span className="font-medium text-foreground">Quality Standard:</span>{" "}
              I acknowledge that repeated cancellations or incomplete tasks may
              result in account suspension.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">— End of agreement —</p>
        </div>
      </ScrollArea>

      <label
        className={cn(
          "flex items-start gap-2 text-sm",
          !hasScrolledToEnd && "opacity-50 cursor-not-allowed"
        )}
      >
        <Checkbox
          checked={agreed}
          disabled={!hasScrolledToEnd}
          onCheckedChange={() => hasScrolledToEnd && onToggle()}
          className="mt-0.5"
          aria-invalid={!!error}
        />
        <span>
          I have read and agree to the Worker Agreement and Terms &amp; Conditions above.
        </span>
      </label>

      {!hasScrolledToEnd && (
        <p className="text-xs text-muted-foreground">
          Scroll to the bottom of the agreement to enable this checkbox.
        </p>
      )}
      {error && <p className="text-xs text-red-800">{error}</p>}
    </div>
  )
}

// ---------- Main form ----------

export function ApplyWorkerForm({ className, ...props }: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: undefined as string | undefined,
    password: "",
    confirmPassword: "",
    location: "",
    workTypes: [] as string[],
    preferredWorks: [] as string[],
    agreedToTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Custom (user-typed) options, kept separate from the built-in lists so
  // labels/icons stay available for badge rendering even after re-render.
  const [customWorkTypes, setCustomWorkTypes] = useState<SelectOption[]>([])
  const [customPreferredWorks, setCustomPreferredWorks] = useState<SelectOption[]>([])

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

  const handleWorkTypesChange = (values: string[]) => {
    setForm((prev) => ({ ...prev, workTypes: values }))
    if (errors.workType) {
      setErrors((prev) => ({ ...prev, workType: undefined }))
    }
  }

  const handlePreferredWorksChange = (values: string[]) => {
    setForm((prev) => ({ ...prev, preferredWorks: values }))
    if (errors.preferredWork) {
      setErrors((prev) => ({ ...prev, preferredWork: undefined }))
    }
  }

  const addCustomWorkType = (option: SelectOption) => {
    setCustomWorkTypes((prev) =>
      prev.some((o) => o.value === option.value) ? prev : [...prev, option]
    )
  }

  const addCustomPreferredWork = (option: SelectOption) => {
    setCustomPreferredWorks((prev) =>
      prev.some((o) => o.value === option.value) ? prev : [...prev, option]
    )
  }

  // ---------- Per-step validators ----------

  const validateStep1 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.name.trim()) {
      stepErrors.name = "Full name is required"
    }

    if (!form.email.trim()) {
      stepErrors.email = "Email is required"
    } else if (!emailRegex.validEmail.test(form.email.trim())) {
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
      stepErrors.location = "Address is required"
    }
    if (form.workTypes.length === 0) {
      stepErrors.workType = "Select at least one work type"
    }
    if (form.preferredWorks.length === 0) {
      stepErrors.preferredWork = "Select at least one preferred work"
    }

    setErrors((prev) => ({ ...prev, location: undefined, workType: undefined, preferredWork: undefined, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }

  const validateStep4 = (): boolean => {
    const stepErrors: Partial<FormErrors> = {}

    if (!form.agreedToTerms) {
      stepErrors.confirmations = "Please read and accept the agreement to continue."
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
        workTypes: form.workTypes,
        preferredWorks: form.preferredWorks,
        confirmations: {
          reliable: form.agreedToTerms,
          experienced: form.agreedToTerms,
          honest: form.agreedToTerms,
          termsAccepted: form.agreedToTerms,
        }
      };
      const result = await WorkService.applyForWorker(workerData);

      console.log("Application result:", result);

      if (result.data.success) {
        toast.success("Successfully applied!", {
          description: "Check your email. We'll update you within 1 hour."
        });
        navigate('/');
      } else {
        toast.error(result.data.message || "Application failed");
      }
    } catch (error) {
      console.error(getErrorMessage(error));

      const errorMessage = getErrorMessage(error) ||
        "Error while applying to become a worker. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardContent>
        <Stepper
          initialStep={1}
          onStepChange={() => { }}
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
                    className={errors.name ? "border-red-900 focus-visible:ring-red-800" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-800">{errors.name}</p>
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
                    <p className="text-xs text-red-800">{errors.email}</p>
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
                    <p className="text-xs text-red-800">{errors.phone}</p>
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
                    <p className="text-xs text-red-800">{errors.password}</p>
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
                    <p className="text-xs text-red-800">{errors.confirmPassword}</p>
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
                    <p className="text-xs text-red-800">{errors.location}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="workType">Work Types (preferred work types)</FieldLabel>
                  <MultiSelect
                    options={WORK_TYPE_OPTIONS}
                    selected={form.workTypes}
                    onChange={handleWorkTypesChange}
                    customOptions={customWorkTypes}
                    onCreateOption={addCustomWorkType}
                    placeholder="Select work types..."
                    searchPlaceholder="Search or type your own..."
                    error={!!errors.workType}
                  />
                  {errors.workType && (
                    <p className="text-xs text-red-800">{errors.workType}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="preferredWork">Select Preferred Works</FieldLabel>
                  <MultiSelect
                    options={PREFERRED_WORK_OPTIONS}
                    selected={form.preferredWorks}
                    onChange={handlePreferredWorksChange}
                    customOptions={customPreferredWorks}
                    onCreateOption={addCustomPreferredWork}
                    placeholder="Select preferred works..."
                    searchPlaceholder="Search or type your own..."
                    error={!!errors.preferredWork}
                  />
                  {errors.preferredWork && (
                    <p className="text-xs text-red-800">{errors.preferredWork}</p>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </Step>

          {/* ---------- STEP 4 ---------- */}
          <Step>
            <WorkerAgreementScroll
              agreed={form.agreedToTerms}
              onToggle={() =>
                setForm((prev) => {
                  if (errors.confirmations) {
                    setErrors((e) => ({ ...e, confirmations: undefined }))
                  }
                  return { ...prev, agreedToTerms: !prev.agreedToTerms }
                })
              }
              error={errors.confirmations}
            />
          </Step>
        </Stepper>
      </CardContent>
    </div>
  )
}