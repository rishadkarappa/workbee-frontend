import {
  BriefcaseBusinessIcon,
  BrushCleaningIcon,
  CarFrontIcon,
  ClipboardListIcon,
  ComputerIcon,
  CookingPotIcon,
  Flower2Icon,
  HouseIcon,
  PackageIcon,
  PaintbrushIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserRoundIcon,
  WrenchIcon,
  CircleHelpIcon,
} from "lucide-react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

import { Input } from "@/components/ui/input"

const workCategories = [
  {
    value: "cleaning",
    label: "Cleaning",
    icon: BrushCleaningIcon,
  },
  {
    value: "handyman",
    label: "Handyman & Home Repairs",
    icon: WrenchIcon,
  },
  {
    value: "moving",
    label: "Moving",
    icon: TruckIcon,
  },
  {
    value: "furniture_assembly",
    label: "Furniture Assembly",
    icon: HouseIcon,
  },
  {
    value: "mounting_installation",
    label: "Mounting & Installation",
    icon: BriefcaseBusinessIcon,
  },
  {
    value: "yardwork",
    label: "Yardwork & Gardening",
    icon: Flower2Icon,
  },
  {
    value: "shopping_delivery",
    label: "Shopping & Delivery",
    icon: ShoppingCartIcon,
  },
  {
    value: "errands",
    label: "Errands & Personal Assistance",
    icon: ClipboardListIcon,
  },
  {
    value: "automotive",
    label: "Automotive",
    icon: CarFrontIcon,
  },
  {
    value: "painting",
    label: "Painting",
    icon: PaintbrushIcon,
  },
  {
    value: "packing",
    label: "Packing & Organization",
    icon: PackageIcon,
  },
  {
    value: "computer_help",
    label: "Computer & Technical Help",
    icon: ComputerIcon,
  },
  {
    value: "cooking",
    label: "Cooking & Food Help",
    icon: CookingPotIcon,
  },
  {
    value: "personal_assistance",
    label: "Personal Assistance",
    icon: UserRoundIcon,
  },
  {
    value: "other",
    label: "None of the above",
    icon: CircleHelpIcon,
  },
]

interface SelectWorkCategoryProps {
  value: string
  onChange: (value: string) => void
}

const SelectWorkCategory = ({
  value,
  onChange,
}: SelectWorkCategoryProps) => {
  const isOther = value === "other" || (
    value !== "" &&
    !workCategories.some((category) => category.value === value)
  )

  const selectedValue = isOther ? "other" : value

  return (
    <div className="space-y-2">
      <Combobox
        items={workCategories}
        value={selectedValue}
        onValueChange={(newValue) => {
          if (newValue !== null) {
            onChange(newValue)
          }
        }}
      >
        <ComboboxInput placeholder="Select a work category" />

        <ComboboxContent>
          <ComboboxEmpty>
            No work categories found.
          </ComboboxEmpty>

          <ComboboxList>
            {(item) => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                className="flex items-center gap-2"
              >
                <item.icon className="size-4 text-muted-foreground" />
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {isOther && (
        <Input
          value={value === "other" ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your work category"
        />
      )}
    </div>
  )
}

export default SelectWorkCategory