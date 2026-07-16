// lib/bd-address.ts
// সংক্ষিপ্ত রেফারেন্স ডেটা — প্রয়োজনমতো সম্প্রসারণ করুন
export const bdAddress: Record<string, Record<string, string[]>> = {
  "ঢাকা": {
    "ঢাকা": ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "মোহাম্মদপুর", "যাত্রাবাড়ী"],
    "গাজীপুর": ["গাজীপুর সদর", "কালিয়াকৈর", "শ্রীপুর"],
    "নারায়ণগঞ্জ": ["সদর", "সোনারগাঁও", "রূপগঞ্জ"],
  },
  "চট্টগ্রাম": {
    "চট্টগ্রাম": ["পাঁচলাইশ", "কোতোয়ালী", "পাহাড়তলী", "হালিশহর"],
    "কক্সবাজার": ["সদর", "টেকনাফ", "উখিয়া"],
    "কুমিল্লা": ["সদর", "দেবীদ্বার", "বুড়িচং"],
  },
  "রাজশাহী": {
    "রাজশাহী": ["বোয়ালিয়া", "মতিহার", "রাজপাড়া"],
    "বগুড়া": ["সদর", "শেরপুর", "শিবগঞ্জ"],
  },
  "খুলনা": {
    "খুলনা": ["সদর", "সোনাডাঙ্গা", "খালিশপুর"],
    "যশোর": ["সদর", "ঝিকরগাছা"],
  },
  "সিলেট": {
    "সিলেট": ["সদর", "বিয়ানীবাজার", "গোলাপগঞ্জ"],
  },
  "বরিশাল": {
    "বরিশাল": ["সদর", "বাকেরগঞ্জ"],
  },
  "রংপুর": {
    "রংপুর": ["সদর", "মিঠাপুকুর"],
  },
  "ময়মনসিংহ": {
    "ময়মনসিংহ": ["সদর", "ত্রিশাল"],
  },
};

export const divisions = Object.keys(bdAddress);

export function getDistricts(division: string): string[] {
  return Object.keys(bdAddress[division] ?? {});
}

export function getThanas(division: string, district: string): string[] {
  return bdAddress[division]?.[district] ?? [];
}

// ডেলিভারি জোন নির্ধারণ (ঢাকা বিভাগের ঢাকা জেলা হলে "Dhaka" জোন, বাকি সব "Outside Dhaka")
export function resolveZone(division: string, district: string): string {
  if (division === "ঢাকা" && district === "ঢাকা") return "Dhaka";
  return "Outside Dhaka";
}
