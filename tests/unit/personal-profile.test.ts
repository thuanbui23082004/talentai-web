import { describe, expect, it } from "vitest";
import { personalPayload, personalToDraft } from "@/features/profile/personal-mapping";
import { emptyProfileDraft, profileEditorSchema } from "@/features/profile/schemas/profile-editor";
import personal from "../../contracts/examples/candidate-personal.json";
import { addressToDraft, personalAddressPayload } from "@/features/profile/personal-address";
import { findProvinceByCity } from "@/lib/locations/vietnam";

describe("personal profile mapping", () => {
    it("sends personal fields without overwriting avatar or career information", () => {
        const draft = personalToDraft(personal);
        expect(draft.birthDate).toBe("1998-08-10");
        expect(draft.address).toBe("");
        expect(draft.location).toBe(findProvinceByCity(personal.location)?.code);
        expect(personalPayload(draft, personal)).toEqual({ fullName: personal.fullName, email: personal.email, phone: personal.phone, address: personal.location, location: personal.location, dob: personal.dob, gender: personal.gender, searchable: personal.searchable, showEmail: personal.showEmail, showPhone: personal.showPhone });
        expect(personalPayload({ ...emptyProfileDraft("introduction"), description: personal.summary })).toEqual({ summary: personal.summary });
    });
    it("preserves the original timestamp until the birthday changes", () => {
        const original = { ...personal, dob: "1998-08-10T06:30:00+07:00" };
        const draft = personalToDraft(original);
        expect(personalPayload(draft, original).dob).toBe(original.dob);
        expect(personalPayload({ ...draft, birthDate: "2000-02-29" }, original).dob).toBe("2000-02-29T00:00:00Z");
    });
    it("validates calendar dates", () => {
        const draft = personalToDraft(personal);
        expect(profileEditorSchema.safeParse(draft).success).toBe(true);
        for (const changes of [{ birthDate: "2023-02-29" }, { birthDate: "2099-01-01" }]) {
            expect(profileEditorSchema.safeParse({ ...draft, ...changes }).success).toBe(false);
        }
    });
    it("splits and joins saved addresses repeatedly without duplicating province or ward", () => {
        const province = findProvinceByCity("Đà Nẵng")!;
        const ward = province.wards.find(item => item.name === "Phường Hải Châu")!;
        const value = { location: `${province.code}:${ward.code}` };
        const saved = personalAddressPayload(value.location);
        expect(saved).toEqual({ address: "Phường Hải Châu, Đà Nẵng", location: "Đà Nẵng" });
        expect(addressToDraft(saved.address, saved.location)).toEqual(value);
        expect(addressToDraft(saved.address, "")).toEqual(value);
        expect(addressToDraft("123 đường kiểm thử, Phường Hải Châu, Đà Nẵng", "Đà Nẵng")).toEqual(value);
        expect(addressToDraft("Địa chỉ cũ chưa chuẩn hóa", "Địa điểm cũ")).toEqual({ location: "Địa điểm cũ" });
        expect(personalAddressPayload("")).toEqual({ address: "", location: "" });
    });
});
