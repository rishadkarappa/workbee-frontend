export interface PostOffice {
  Name: string
  Block: string
  District: string
  State: string
  Country: string
  Pincode: string
}

export interface PincodeLookupResult {
  postOffices: PostOffice[]
  district: string
  state: string
}

export const PincodeService = {
  async lookup(pincode: string): Promise<PincodeLookupResult | null> {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    if (!res.ok) throw new Error("Failed to fetch pincode details")

    const data = await res.json()
    const entry = data?.[0]

    if (
      !entry ||
      entry.Status !== "Success" ||
      !Array.isArray(entry.PostOffice) ||
      entry.PostOffice.length === 0
    ) {
      return null
    }

    const postOffices: PostOffice[] = entry.PostOffice
    return {
      postOffices,
      district: postOffices[0].District,
      state: postOffices[0].State,
    }
  },
}