import type { components } from "@/lib/api/generated/schema";

export const mockJobs = [
    {
        "id":  "10000000-0000-4000-8000-000000000001",
        "title":  "Lập trình viên Frontend React",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000001",
                        "name":  "Công ty mẫu Sao Việt"
                    },
        "location":  {
                         "city":  "Đà Nẵng",
                         "provinceCode":  "48",
                         "wardCode":  "20194",
                         "ward":  "Phường Hải Vân"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  15000000,
                       "max":  25000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "React",
                       "TypeScript"
                   ],
        "postedAt":  "2026-10-01T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000002",
        "title":  "Chuyên viên tuyển dụng",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000002",
                        "name":  "Công ty mẫu An Bình"
                    },
        "location":  {
                         "city":  "Hà Nội",
                         "provinceCode":  "01",
                         "wardCode":  "00008",
                         "ward":  "Phường Ngọc Hà"
                     },
        "workType":  "full_time",
        "level":  "middle",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  12000000,
                       "max":  18000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Tuyển dụng",
                       "Giao tiếp"
                   ],
        "postedAt":  "2026-10-02T00:00:00Z",
        "applicationDeadline":  "2026-12-20"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000003",
        "title":  "Thực tập sinh Marketing",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000003",
                        "name":  "Công ty mẫu Bình Minh"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25760",
                         "ward":  "Phường Bình Dương"
                     },
        "workType":  "internship",
        "level":  "intern",
        "status":  "open",
        "minExperienceYears":  0,
        "salary":  {
                       "min":  3000000,
                       "max":  5000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Nội dung",
                       "Mạng xã hội"
                   ],
        "postedAt":  "2026-10-03T00:00:00Z",
        "applicationDeadline":  "2026-12-15"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000004",
        "title":  "Full Stack JavaScript Developer",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000004",
                        "name":  "Công ty mẫu TechNova"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25747",
                         "ward":  "Phường Thủ Dầu Một"
                     },
        "workType":  "full_time",
        "level":  "senior",
        "status":  "open",
        "minExperienceYears":  4,
        "salary":  {
                       "min":  25000000,
                       "max":  40000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "JavaScript",
                       "Node.js"
                   ],
        "postedAt":  "2026-10-04T00:00:00Z",
        "applicationDeadline":  "2026-12-25"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000005",
        "title":  "Nhân viên triển khai phần mềm",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000005",
                        "name":  "Công ty mẫu Mây Việt"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25750",
                         "ward":  "Phường Phú Lợi"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  8000000,
                       "max":  12000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Triển khai",
                       "Phần mềm"
                   ],
        "postedAt":  "2026-10-05T00:00:00Z",
        "applicationDeadline":  "2026-12-28"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000006",
        "title":  "Web Developer – Làm việc từ xa",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000006",
                        "name":  "Công ty mẫu GreenSoft"
                    },
        "location":  {
                         "city":  "An Giang",
                         "provinceCode":  "91",
                         "wardCode":  "30307",
                         "ward":  "Phường Long Xuyên"
                     },
        "workType":  "remote",
        "level":  "middle",
        "status":  "open",
        "minExperienceYears":  3,
        "salary":  {
                       "min":  10000000,
                       "max":  15000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "JavaScript",
                       "HTML",
                       "CSS"
                   ],
        "postedAt":  "2026-10-06T00:00:00Z",
        "applicationDeadline":  "2026-12-30"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000007",
        "title":  "Nhân viên kế toán nội bộ",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000007",
                        "name":  "Công ty mẫu Hòa Phát"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25747",
                         "ward":  "Phường Thủ Dầu Một"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  8000000,
                       "max":  12000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-07T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000008",
        "title":  "Chuyên viên chăm sóc khách hàng",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000008",
                        "name":  "Công ty mẫu Minh Anh"
                    },
        "location":  {
                         "city":  "Hà Nội",
                         "provinceCode":  "01",
                         "wardCode":  "00008",
                         "ward":  "Phường Ngọc Hà"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  9000000,
                       "max":  13000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-08T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000009",
        "title":  "Nhân viên kinh doanh thiết bị",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000009",
                        "name":  "Công ty mẫu Đại Việt"
                    },
        "location":  {
                         "city":  "Đà Nẵng",
                         "provinceCode":  "48",
                         "wardCode":  "20200",
                         "ward":  "Phường Hòa Khánh"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  10000000,
                       "max":  14000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-09T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000010",
        "title":  "Thiết kế đồ họa thương hiệu",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000010",
                        "name":  "Công ty mẫu Sáng Tạo"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25747",
                         "ward":  "Phường Thủ Dầu Một"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  8000000,
                       "max":  15000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-10T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000011",
        "title":  "Nhân viên quản lý kho",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000011",
                        "name":  "Công ty mẫu Nam Long"
                    },
        "location":  {
                         "city":  "Hà Nội",
                         "provinceCode":  "01",
                         "wardCode":  "00008",
                         "ward":  "Phường Ngọc Hà"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  9000000,
                       "max":  12000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-11T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000012",
        "title":  "Chuyên viên vận hành thương mại điện tử",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000012",
                        "name":  "Công ty mẫu Việt Commerce"
                    },
        "location":  {
                         "city":  "Đà Nẵng",
                         "provinceCode":  "48",
                         "wardCode":  "20200",
                         "ward":  "Phường Hòa Khánh"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  10000000,
                       "max":  13000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-12T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000013",
        "title":  "Nhân viên hành chính nhân sự",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000013",
                        "name":  "Công ty mẫu Phú An"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25747",
                         "ward":  "Phường Thủ Dầu Một"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  8000000,
                       "max":  14000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-13T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000014",
        "title":  "Chuyên viên nội dung số",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000014",
                        "name":  "Công ty mẫu Truyền Thông Mới"
                    },
        "location":  {
                         "city":  "Hà Nội",
                         "provinceCode":  "01",
                         "wardCode":  "00008",
                         "ward":  "Phường Ngọc Hà"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  9000000,
                       "max":  15000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-14T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000015",
        "title":  "Nhân viên hỗ trợ kỹ thuật",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000015",
                        "name":  "Công ty mẫu An Tâm"
                    },
        "location":  {
                         "city":  "Đà Nẵng",
                         "provinceCode":  "48",
                         "wardCode":  "20200",
                         "ward":  "Phường Hòa Khánh"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  10000000,
                       "max":  12000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-15T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000016",
        "title":  "Chuyên viên kiểm thử phần mềm",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000016",
                        "name":  "Công ty mẫu Chất Lượng Việt"
                    },
        "location":  {
                         "city":  "TP.HCM",
                         "provinceCode":  "79",
                         "wardCode":  "25747",
                         "ward":  "Phường Thủ Dầu Một"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  8000000,
                       "max":  13000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-16T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000017",
        "title":  "Nhân viên tư vấn dịch vụ",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000017",
                        "name":  "Công ty mẫu Thịnh Vượng"
                    },
        "location":  {
                         "city":  "Hà Nội",
                         "provinceCode":  "01",
                         "wardCode":  "00008",
                         "ward":  "Phường Ngọc Hà"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  1,
        "salary":  {
                       "min":  9000000,
                       "max":  14000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-17T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    },
    {
        "id":  "10000000-0000-4000-8000-000000000018",
        "title":  "Điều phối viên logistics",
        "company":  {
                        "id":  "20000000-0000-4000-8000-000000000018",
                        "name":  "Công ty mẫu Việt Logistics"
                    },
        "location":  {
                         "city":  "Đà Nẵng",
                         "provinceCode":  "48",
                         "wardCode":  "20200",
                         "ward":  "Phường Hòa Khánh"
                     },
        "workType":  "full_time",
        "level":  "junior",
        "status":  "open",
        "minExperienceYears":  2,
        "salary":  {
                       "min":  10000000,
                       "max":  15000000,
                       "currency":  "VND",
                       "period":  "month",
                       "negotiable":  false
                   },
        "skills":  [
                       "Giao tiếp",
                       "Làm việc nhóm"
                   ],
        "postedAt":  "2026-10-18T00:00:00Z",
        "applicationDeadline":  "2026-12-31"
    }
] satisfies components["schemas"]["JobSummary"][];
