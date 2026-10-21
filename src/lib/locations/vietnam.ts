import data from "./vietnam-2025.json";

export const provinces = data;
export function provinceCity(name: string) {
    return name === "Thành phố Hồ Chí Minh" ? "TP.HCM" : name.replace(/^(Tỉnh|Thành phố) /, "");
}
export function normalizeLocation(value: string) {
    return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}
export function findProvinceByCity(city?: string) {
    return provinces.find((province) => normalizeLocation(provinceCity(province.name)) === normalizeLocation(city ?? "") || normalizeLocation(province.name) === normalizeLocation(city ?? ""));
}
export function resolveLocation(value: string) {
    const [provinceCode, wardCode] = value.split(":");
    const province = provinces.find((item) => item.code === provinceCode);
    const ward = province?.wards.find((item) => item.code === wardCode);
    return { province, ward };
}
