import { useEffect, useState } from "react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { INDIAN_STATES } from "@/constants/indian-states/india-states"
import { PincodeService } from "@/services/pincode-service"
import type { PostOffice } from "@/services/pincode-service"

export interface AddressFormValue {
  state: string
  pincode: string
  panchayath: string
  city: string
  place: string
}

export type AddressFieldErrors = Partial<Record<keyof AddressFormValue, string>>

interface AddressStepProps {
  value: AddressFormValue
  onChange: (value: AddressFormValue) => void
  errors: AddressFieldErrors
  clearError: (field: keyof AddressFormValue) => void
}

export function AddressStep({ value, onChange, errors, clearError }: AddressStepProps) {
  const [postOffices, setPostOffices] = useState<PostOffice[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const set = (patch: Partial<AddressFormValue>) => onChange({ ...value, ...patch })

  // Debounced: as soon as a valid 6-digit pincode is entered, fetch the
  // matching post offices and use them to populate panchayath/city/state.
  useEffect(() => {
    const pin = value.pincode
    if (pin.length !== 6) {
      setPostOffices([])
      setLookupError(null)
      return
    }

    let cancelled = false
    setIsLookingUp(true)
    setLookupError(null)

    const timer = setTimeout(async () => {
      try {
        const result = await PincodeService.lookup(pin)
        if (cancelled) return

        if (!result) {
          setPostOffices([])
          setLookupError("No records found for this pincode")
          return
        }

        setPostOffices(result.postOffices)

        const validPanchayaths = result.postOffices.map((po) => po.Name)
        set({
          state:
            INDIAN_STATES.find(
              (s) => s.toLowerCase() === result.state.toLowerCase()
            ) ?? value.state,
          city: result.district || value.city,
          panchayath: validPanchayaths.includes(value.panchayath)
            ? value.panchayath
            : "",
        })
      } catch {
        if (!cancelled) setLookupError("Couldn't verify this pincode. Try again.")
      } finally {
        if (!cancelled) setIsLookingUp(false)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode])

  return (
    <form className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="state">State</FieldLabel>
          <Select
            value={value.state}
            onValueChange={(v) => {
              set({ state: v })
              if (errors.state) clearError("state")
            }}
          >
            <SelectTrigger
              id="state"
              aria-invalid={!!errors.state}
              className={errors.state ? "border-red-500 focus-visible:ring-red-500 w-full" : "w-full"}
            >
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-xs text-red-800">{errors.state}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
          <div className="relative">
            <Input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              value={value.pincode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6)
                set({ pincode: digits })
                if (errors.pincode) clearError("pincode")
              }}
              placeholder="6-digit pincode"
              aria-invalid={!!errors.pincode}
              className={errors.pincode ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {isLookingUp && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {lookupError && <p className="text-xs text-muted-foreground">{lookupError}</p>}
          {errors.pincode && <p className="text-xs text-red-800">{errors.pincode}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="panchayath">Panchayath / Post Office</FieldLabel>
          <Select
            value={value.panchayath}
            onValueChange={(v) => {
              set({ panchayath: v })
              if (errors.panchayath) clearError("panchayath")
            }}
            disabled={postOffices.length === 0}
          >
            <SelectTrigger
              id="panchayath"
              aria-invalid={!!errors.panchayath}
              className={errors.panchayath ? "border-red-500 focus-visible:ring-red-500 w-full" : "w-full"}
            >
              <SelectValue
                placeholder={
                  postOffices.length === 0
                    ? "Enter a valid pincode first"
                    : "Select your panchayath / post office"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {postOffices.map((po) => (
                <SelectItem key={`${po.Name}-${po.Pincode}`} value={po.Name}>
                  {po.Name}
                  {po.Block && po.Block !== "NA" ? ` (${po.Block})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.panchayath && <p className="text-xs text-red-800">{errors.panchayath}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="city">City / District</FieldLabel>
          <Input
            id="city"
            name="city"
            value={value.city}
            onChange={(e) => {
              set({ city: e.target.value })
              if (errors.city) clearError("city")
            }}
            placeholder="Auto-filled from pincode, edit if needed"
            aria-invalid={!!errors.city}
            className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.city && <p className="text-xs text-red-800">{errors.city}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="place">Place / Locality / Landmark</FieldLabel>
          <Input
            id="place"
            name="place"
            value={value.place}
            onChange={(e) => {
              set({ place: e.target.value })
              if (errors.place) clearError("place")
            }}
            placeholder="House name, street, landmark..."
            aria-invalid={!!errors.place}
            className={errors.place ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.place && <p className="text-xs text-red-800">{errors.place}</p>}
        </Field>
      </FieldGroup>
    </form>
  )
}