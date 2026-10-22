# Bản code đề xuất — Chi tiết tin tuyển dụng

Trạng thái: ĐÃ DUYỆT VÀ ÁP DỤNG. Nội dung bên dưới lưu lại bản đề xuất đã được duyệt; mã nguồn thực tế nằm trong `src/`.
Phạm vi: giao diện Recruiter dùng dữ liệu mẫu, không thay đổi contract, BFF hay các vai trò khác.

## 1. Route mới: src/app/(recruiter)/recruiter/jobs/[jobId]/page.tsx

```tsx
import { notFound } from 'next/navigation';
import { RecruiterJobDetail } from '@/features/recruiter';
import { recruiterPreviewJobs } from '@/mocks/fixtures/recruiter-preview';

export default async function RecruiterJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = recruiterPreviewJobs.find(item => item.id === jobId);

  if (!job) notFound();

  return <RecruiterJobDetail job={job} />;
}
```

## 2. Component mới: src/features/recruiter/components/recruiter-job-detail.tsx

Trạng thái tạm dừng/đóng chỉ là mô phỏng trong phiên xem trang. Nút chia sẻ sao chép đường dẫn trang quản lý hiện tại, không tạo URL tin công khai. Không hiển thị nút nhân bản khi chưa triển khai luồng form tạo tin từ dữ liệu cũ.

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft, BriefcaseBusiness, Check,
  Pause, Play, Share2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecruiterPreviewJob } from '@/mocks/fixtures/recruiter-preview';

type PreviewStatus = RecruiterPreviewJob['status'] | 'paused' | 'closed';
type Action = 'pause' | 'close' | 'reopen';

export function RecruiterJobDetail({ job }: { job: RecruiterPreviewJob }) {
  const t = useTranslations('Recruiter');
  const [status, setStatus] = useState<PreviewStatus>(job.status);
  const [confirmation, setConfirmation] = useState<Action | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState('copied');
    } catch {
      setShareState('failed');
    }
  }

  function confirmAction() {
    if (!confirmation) return;
    setStatus(confirmation === 'pause' ? 'paused' : confirmation === 'close' ? 'closed' : 'open');
    setConfirmation(null);
  }

  const facts = [
    { label: t('detailExperience'), value: t('detailYears', { count: job.experience }) },
    { label: t('type'), value: t(job.type) },
    { label: t('locationLabel'), value: job.location },
    { label: t('detailCompany'), value: job.company },
  ];

  return (
    <div className="jobs-page recruiter-job-detail-page">
      <div className="detail-toolbar">
        <Link href="/recruiter/jobs" className="detail-back">
          <ArrowLeft size={18} />
          <h1>{t('jobDetailHeading')}</h1>
        </Link>
        <div className="detail-actions">
          {status === 'open' && (
            <Button variant="outline" onClick={() => setConfirmation('pause')}>
              <Pause size={14} />{t('pauseJob')}
            </Button>
          )}
          {(status === 'paused' || status === 'closed') && (
            <Button variant="outline" onClick={() => setConfirmation('reopen')}>
              <Play size={14} />{t('reopenJob')}
            </Button>
          )}
          {(status === 'open' || status === 'paused') && (
            <Button variant="outline" onClick={() => setConfirmation('close')}>
              <X size={14} />{t('closeJob')}
            </Button>
          )}
          <Button variant="outline" onClick={share}>
            {shareState === 'copied' ? <Check size={14} /> : <Share2 size={14} />}
            {t(shareState === 'copied' ? 'detailCopied' : 'detailShare')}
          </Button>
        </div>
      </div>

      <p className="detail-preview-note">{t('detailPreviewNotice')}</p>
      {shareState === 'copied' && <p role="status">{t('detailCopiedNotice')}</p>}
      {shareState === 'failed' && <p role="alert">{t('detailCopyFailed')}</p>}

      {confirmation && (
        <section className="recruiter-panel detail-confirmation" aria-labelledby="detail-confirm-title">
          <h2 id="detail-confirm-title">{t('detailConfirmTitle')}</h2>
          <p>{t('detailConfirmDescription')}</p>
          <div className="detail-actions">
            <Button className="recruiter-primary" onClick={confirmAction}>
              {t('detailConfirm')}
            </Button>
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              {t('cancel')}
            </Button>
          </div>
        </section>
      )}

      <div className="detail-columns">
        <article>
          <header className="detail-job-heading">
            <span className="detail-position-icon"><BriefcaseBusiness size={25} /></span>
            <div className="detail-title-block">
              <h2>{job.title}</h2>
              <p>{job.company}</p>
            </div>
            <div className="detail-salary">
              <strong>{job.salary === 'negotiable' ? t('negotiable') : job.salary}</strong>
              <span>{job.location}</span>
            </div>
          </header>

          <dl className="detail-facts">
            {facts.map(fact => (
              <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl>

          {(['description', 'requirements', 'benefits'] as const).map(section => (
            <section className="detail-content-section" key={section}>
              <h3>{t(section === 'description' ? 'description' : section === 'requirements' ? 'detailRequirements' : 'detailBenefits')}</h3>
              <div>
                {job[section].map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </article>

        <aside className="detail-info-card">
          <div className="detail-info-heading">
            <h2>{t('detailPostingInfo')}</h2>
            <span className="job-status"><span className="status-dot" />{t(status)}</span>
          </div>
          <dl className="detail-info-list">
            <div><dt>{t('status')}</dt><dd aria-live="polite">{t(status)}</dd></div>
            <div><dt>{t('detailCreated')}</dt><dd>{job.createdDateLabel}</dd></div>
            <div><dt>{t('detailRecruitmentPeriod')}</dt><dd>{job.recruitmentPeriodLabel}</dd></div>
            <div><dt>{t('detailApplicantCount')}</dt><dd className="detail-highlight">{t('applicants', { count: job.applicants })}</dd></div>
            <div><dt>{t('detailHeadcount')}</dt><dd>{job.headcount}</dd></div>
            <div><dt>{t('detailViews')}</dt><dd>{job.viewCount}</dd></div>
            <div><dt>{t('detailUpdated')}</dt><dd>{t('updated', { hours: job.hours })}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
```

Không thêm API giả cho chia sẻ/nhân bản.

## 3. Bổ sung fixture hiện có, không tạo kho dữ liệu thứ hai

Thêm các trường UI preview sau vào `RecruiterPreviewJob` tại `src/mocks/fixtures/recruiter-preview.ts`:

```ts
description: string[];
requirements: string[];
benefits: string[];
createdDateLabel: string;
recruitmentPeriodLabel: string;
headcount: number;
viewCount: number;
```

Ví dụ dữ liệu giả bổ sung cho `preview-1`:

```ts
description: [
  'Tham gia xây dựng và phát triển các sản phẩm phần mềm của Công ty Công nghệ Sao Mai.',
  'Phối hợp cùng đội ngũ sản phẩm, thiết kế và kiểm thử để triển khai tính năng phù hợp với nhu cầu người dùng.',
],
requirements: [
  'Có kinh nghiệm phát triển ứng dụng web với JavaScript, TypeScript và Node.js.',
  'Hiểu về cơ sở dữ liệu, API và quy trình phát triển phần mềm.',
  'Chủ động trao đổi, có khả năng làm việc nhóm và giải quyết vấn đề.',
],
benefits: [
  'Môi trường làm việc cởi mở, hỗ trợ học tập và phát triển chuyên môn.',
  'Được cung cấp thiết bị làm việc và tham gia hoạt động nội bộ của doanh nghiệp.',
],
createdDateLabel: '01 Tháng 10, 2026',
recruitmentPeriodLabel: '01 Tháng 10, 2026 – 31 Tháng 12, 2026',
headcount: 2,
viewCount: 150,
```

Các tin còn lại dùng nội dung mẫu phù hợp từng vị trí. Bản nháp hiện tại cần được bổ sung các trường này tại nơi tạo và giữ lại nội dung textarea (hiện textarea chưa được lưu). Không đổi kiểu payload API; đây chỉ là kiểu UI preview đã tồn tại.

## 4. Chuỗi dịch bổ sung vào Recruiter trong messages.ts

```ts
jobDetailHeading: 'Chi tiết tin tuyển dụng',
detailExperience: 'Kinh nghiệm',
detailYears: '{count, plural, =0 {Không yêu cầu kinh nghiệm} other {# năm kinh nghiệm}}',
detailCompany: 'Doanh nghiệp',
detailRequirements: 'Yêu cầu ứng viên',
detailBenefits: 'Quyền lợi',
detailPostingInfo: 'Thông tin tin đăng',
detailCreated: 'Ngày tạo',
detailRecruitmentPeriod: 'Thời gian tuyển dụng',
detailApplicantCount: 'Tổng số ứng viên',
detailHeadcount: 'Chỉ tiêu tuyển dụng',
detailViews: 'Tổng lượt xem',
detailUpdated: 'Cập nhật lần cuối',
pauseJob: 'Tạm dừng',
closeJob: 'Đóng tin',
reopenJob: 'Mở lại',
paused: 'Tạm dừng',
closed: 'Đã đóng',
detailShare: 'Chia sẻ',
detailCopied: 'Đã sao chép',
detailCopiedNotice: 'Đã sao chép liên kết trang quản lý. Người nhận cần có quyền truy cập phù hợp.',
detailCopyFailed: 'Không thể sao chép liên kết. Bạn có thể sao chép địa chỉ từ thanh trình duyệt.',
detailPreviewNotice: 'Dữ liệu minh họa. Thao tác trạng thái chỉ có hiệu lực trong phiên xem trang này.',
detailConfirmTitle: 'Xác nhận thay đổi trạng thái',
detailConfirmDescription: 'Bạn muốn thực hiện thao tác này trên tin minh họa?',
detailConfirm: 'Xác nhận',
```

## 5. CSS bổ sung vào recruiter.css

```css
.recruiter-job-detail-page { padding-top: 8px; }
.detail-toolbar, .detail-back, .detail-actions,
.detail-job-heading, .detail-info-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-toolbar { justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; }
.detail-back h1 { font-size: 20px; letter-spacing: -.4px; }
.detail-actions { flex-wrap: wrap; }
.detail-actions button { font-size: 11px; }
.detail-preview-note { color: var(--recruiter-muted); font-size: 11px; margin-bottom: 24px !important; }
.detail-columns { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 28px; align-items: start; }
.detail-job-heading { align-items: flex-start; margin: 10px 0 26px; }
.detail-position-icon { display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 10px; background: var(--recruiter-soft); color: var(--recruiter-accent); }
.detail-title-block { min-width: 0; }
.detail-title-block h2 { font-size: 20px; line-height: 1.4; }
.detail-title-block p { color: var(--recruiter-accent); margin-top: 5px; font-size: 12px; }
.detail-salary { margin-left: auto; text-align: right; flex-shrink: 0; }
.detail-salary strong { display: block; color: var(--recruiter-accent); font-size: 18px; }
.detail-salary span { display: block; color: var(--recruiter-muted); font-size: 11px; margin-top: 7px; }
.detail-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; margin: 0 0 28px; }
.detail-facts > div { background: var(--recruiter-soft); border: 1px solid var(--recruiter-border); border-radius: 9px; padding: 13px 10px; text-align: center; }
.detail-facts dt { color: var(--recruiter-muted); font-size: 10px; margin-bottom: 7px; }
.detail-facts dd { margin: 0; font-size: 11px; font-weight: 600; overflow-wrap: anywhere; }
.detail-content-section { margin: 0 0 24px; }
.detail-content-section h3 { font-size: 13px; font-weight: 700; border-left: 4px solid var(--recruiter-accent); padding-left: 9px; margin-bottom: 13px; }
.detail-content-section > div { border-left: 1px solid var(--recruiter-border); padding-left: 13px; }
.detail-content-section p { font-size: 12px; line-height: 1.9; margin-bottom: 9px; }
.detail-info-card { background: var(--recruiter-surface); border: 1px solid var(--recruiter-border); border-radius: 13px; padding: 22px; }
.detail-info-heading { justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid var(--recruiter-border); }
.detail-info-heading h2 { font-size: 14px; }
.detail-info-list { display: grid; gap: 20px; margin: 20px 0 0; }
.detail-info-list dt { color: var(--recruiter-muted); font-size: 11px; margin-bottom: 6px; }
.detail-info-list dd { margin: 0; font-size: 12px; font-weight: 600; line-height: 1.6; }
.detail-highlight { color: var(--recruiter-accent); }
.detail-confirmation { padding: 20px; margin-bottom: 24px; }
.detail-confirmation p { margin: 12px 0; font-size: 12px; }
@media (max-width: 1100px) {
  .detail-columns { grid-template-columns: minmax(0, 1fr) 230px; gap: 20px; }
  .detail-job-heading { flex-wrap: wrap; }
  .detail-salary { margin-left: 60px; text-align: left; }
  .detail-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .detail-columns { grid-template-columns: 1fr; }
  .detail-back h1 { font-size: 18px; }
  .detail-title-block h2 { font-size: 18px; }
  .detail-title-block { flex: 1; }
  .detail-salary { width: 100%; margin-left: 60px; }
  .detail-info-card { padding: 18px; }
}
```

## 6. Nối điều hướng vào danh sách và dashboard

Thêm export trong `src/features/recruiter/index.ts`:

```ts
export { RecruiterJobDetail } from './components/recruiter-job-detail';
```

Trong `recruiter-jobs.tsx`, thay nút Xem chi tiết của các fixture có route bằng Link (thêm import Link):

```tsx
<Link className="detail-card-link" href={`/recruiter/jobs/${job.id}`}>
  {t('detail')}
</Link>
```

```css
.detail-card-link { color: var(--recruiter-primary); font-size: 11px; padding: 9px 0 9px 9px; }
```

Không dẫn bản nháp chỉ có trong state của danh sách sang route đọc fixture tĩnh: bản nháp vẫn dùng panel hiện tại. Giữ `?job=` cũ tương thích, chuyển các link từ dashboard sang `/recruiter/jobs/${job.id}`.

## Khác biệt có chủ đích so với ảnh

- Dùng dữ liệu giả tiếng Việt và VNĐ hiện có, thay số tiền USD và năm 2030 trong ảnh.
- Không tạo nút sửa/nhân bản chưa có luồng hoàn chỉnh. Bước tiếp theo có thể mở rộng form tạo/sửa sau khi duyệt riêng.
- Mục trách nhiệm công việc trong ảnh có thể là một phần của description; không tự thêm field trách nhiệm vào API contract.
- Không hiển thị lượt lưu khi chưa xác định field tương ứng trong contract.
- Thanh tìm kiếm sẽ dùng chung phần tìm kiếm hiện có sau khi tách thành component riêng trong feature; tìm kiếm đưa về danh sách tin. Việc tách chỉ nằm trong Recruiter và giữ hành vi bộ lọc hiện tại.

## Kiểm tra sau khi được duyệt

- Chạy `corepack pnpm typecheck` và `corepack pnpm lint`, báo kết quả thật.
- Kiểm tra route tồn tại/không tồn tại, quay lại danh sách, nút trạng thái và clipboard bị chặn.
- Kiểm tra bố cục ở 360px, 768px và desktop.
- Chưa chạy kiểm tra code đề xuất vì chưa áp dụng vào ứng dụng.
