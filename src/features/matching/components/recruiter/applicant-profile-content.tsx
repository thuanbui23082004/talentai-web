import { BriefcaseBusiness, GraduationCap, Mail, Phone, UserRound } from 'lucide-react';
import type { components } from '@/lib/api/generated/schema';
import { formatDate, formatMonthYear } from '@/lib/utils';

type Applicant = components['schemas']['JobApplicant'];

function ProfileSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return <section className="air-profile-section">
        <h3>{icon}{title}</h3>
        <div className="air-profile-section-body">{children}</div>
    </section>;
}

function Period({ start, end, current }: { start?: string; end?: string; current?: boolean }) {
    return <span className="air-profile-period">{start ? formatMonthYear(start.slice(0, 7)) : 'Chưa cập nhật'} – {current ? 'Hiện tại' : end ? formatMonthYear(end.slice(0, 7)) : 'Chưa cập nhật'}</span>;
}

export function ApplicantProfileContent({ applicant, experienceOnly = false }: { applicant?: Applicant; experienceOnly?: boolean }) {
    const snapshot = applicant?.applicantSnapshot;
    if (experienceOnly) return <ProfileSection title="Kinh nghiệm làm việc" icon={<BriefcaseBusiness size={18} aria-hidden="true" />}>
        {snapshot?.experiences?.length ? <div className="air-profile-entries">{snapshot.experiences.map((experience, index) => <article className="air-profile-entry" key={experience.id ?? index}>
            <Period start={experience.startDate} end={experience.endDate} current={experience.current} />
            <div className="air-profile-entry-content">
                <h4>{experience.title || 'Vị trí chưa cập nhật'}</h4>
                <p className="air-profile-subtitle">{[experience.company, experience.location].filter(Boolean).join(' · ')}</p>
                {experience.description && <p className="air-profile-description">{experience.description}</p>}
            </div>
        </article>)}</div> : <p className="air-profile-empty">Ứng viên chưa cung cấp kinh nghiệm làm việc trong hồ sơ đã nộp.</p>}
    </ProfileSection>;

    return <div className="air-profile-sections">
        <ProfileSection title="Thông tin cá nhân" icon={<UserRound size={18} aria-hidden="true" />}>
            <dl className="air-personal-fields">
                {[{ label: 'Họ và tên', value: applicant?.fullName, Icon: UserRound }, { label: 'Email liên hệ', value: applicant?.email, Icon: Mail }, { label: 'Số điện thoại', value: applicant?.phone, Icon: Phone }, { label: 'Vị trí ứng tuyển', value: applicant?.jobTitle, Icon: BriefcaseBusiness }].map(({ label, value, Icon }) => <div key={label}><Icon size={17} aria-hidden="true" /><div><dt>{label}</dt><dd>{value || 'Chưa cập nhật'}</dd></div></div>)}
            </dl>
        </ProfileSection>
        {applicant?.coverLetter && <ProfileSection title="Giới thiệu" icon={<UserRound size={18} aria-hidden="true" />}><p className="air-profile-description">{applicant.coverLetter}</p></ProfileSection>}
        <ProfileSection title="Học vấn" icon={<GraduationCap size={18} aria-hidden="true" />}>
            {snapshot?.educations?.length ? <div className="air-profile-entries">{snapshot.educations.map((education, index) => <article className="air-profile-entry" key={education.id ?? index}>
                <Period start={education.startDate} end={education.endDate} current={education.isStudying} />
                <div className="air-profile-entry-content"><h4>{education.school || 'Trường chưa cập nhật'}</h4><p className="air-profile-subtitle">{[education.degree, education.fieldOfStudy].filter(Boolean).join(' · ')}</p>{education.description && <p className="air-profile-description">{education.description}</p>}</div>
            </article>)}</div> : <p className="air-profile-empty">Ứng viên chưa cung cấp thông tin học vấn.</p>}
        </ProfileSection>
        <p className="air-profile-empty">Hồ sơ đã nộp {applicant ? `ngày ${formatDate(applicant.appliedAt)}` : ''}. Thông tin được ghi nhận tại thời điểm ứng tuyển.</p>
    </div>;
}
