import { findProvinceByCity, provinces, provinceCity, resolveLocation } from "@/lib/locations/vietnam";

function withoutSuffix(value: string, suffix: string) {
    if (value === suffix) return "";
    return value.endsWith(`, ${suffix}`) ? value.slice(0, -suffix.length - 2).trim() : value;
}

// Read province/ward from older full addresses without keeping house/street details.
export function addressToDraft(address = "", location = "") {
    const province = findProvinceByCity(location) ?? provinces.find(item =>
        [item.name, provinceCity(item.name)].some(name => address === name || address.endsWith(`, ${name}`)));
    if (!province) return { location };
    const detail = withoutSuffix(withoutSuffix(address, province.name), provinceCity(province.name));
    const ward = province.wards.find(item => detail === item.name || detail.endsWith(`, ${item.name}`));
    return { location: ward ? `${province.code}:${ward.code}` : province.code };
}

export function personalAddressPayload(location: string) {
    const { province, ward } = resolveLocation(location);
    const city = province ? provinceCity(province.name) : location.trim();
    return { address: [ward?.name, city].filter(Boolean).join(", "), location: city };
}
