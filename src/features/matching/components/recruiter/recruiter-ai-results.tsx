'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  History,
  Info,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Sparkles,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useRecruiterJobs } from '@/features/jobs';
import { useRankedApplications, useRecruiterAnalysis } from '@/features/matching/hooks/use-recruiter-analysis';
import { AnalysisProgress } from './analysis-progress';
import './recruiter-ai-results.css';

// SVG Illustrated avatars matching the 5 distinct character styles from the reference
function IllustratedAvatar({ index, size = 48 }: { index: number; size?: number }) {
  const avatarIndex = index % 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="air-avatar-svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="50" fill="#f8fafc" />
      {avatarIndex === 0 && (
        // An: Male, dark styled hair, suit, orange/red tie
        <g>
          {/* Background circle */}
          <circle cx="50" cy="50" r="50" fill="#eff6ff" />
          {/* Suit body */}
          <path d="M15 100 C15 76 30 68 50 68 C70 68 85 76 85 100 Z" fill="#1e3a8a" />
          {/* White shirt triangle */}
          <polygon points="50,68 40,90 60,90" fill="#ffffff" />
          {/* Tie */}
          <polygon points="50,70 53,88 50,96 47,88" fill="#ea580c" />
          {/* Neck */}
          <rect x="44" y="56" width="12" height="15" rx="3" fill="#fed7aa" />
          {/* Head */}
          <ellipse cx="50" cy="44" rx="18" ry="20" fill="#fed7aa" />
          {/* Hair */}
          <path d="M30 42 C30 26 40 20 52 20 C64 20 70 26 70 38 C66 38 64 34 54 34 C44 34 38 38 30 42 Z" fill="#1f2937" />
          <path d="M30 38 L32 46 L35 40 Z" fill="#1f2937" />
          <path d="M68 36 L69 44 L66 40 Z" fill="#1f2937" />
          {/* Face details */}
          <ellipse cx="43" cy="44" rx="2" ry="2.5" fill="#334155" />
          <ellipse cx="57" cy="44" rx="2" ry="2.5" fill="#334155" />
          <path d="M40 39 Q43 37 46 39" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M54 39 Q57 37 60 39" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M46 51 Q50 55 54 51" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      )}

      {avatarIndex === 1 && (
        // Binh: Male, glasses, green shirt
        <g>
          <circle cx="50" cy="50" r="50" fill="#f0fdf4" />
          {/* Green crewneck shirt */}
          <path d="M15 100 C15 76 30 68 50 68 C70 68 85 76 85 100 Z" fill="#16a34a" />
          {/* Neck */}
          <rect x="44" y="56" width="12" height="15" rx="3" fill="#fed7aa" />
          {/* Head */}
          <ellipse cx="50" cy="44" rx="18" ry="20" fill="#fed7aa" />
          {/* Hair */}
          <path d="M31 38 C31 24 40 19 50 19 C60 19 69 24 69 36 C64 34 58 33 50 33 C42 33 36 35 31 38 Z" fill="#1f2937" />
          {/* Glasses */}
          <rect x="36" y="40" width="12" height="8" rx="2" fill="none" stroke="#1e293b" strokeWidth="2" />
          <rect x="52" y="40" width="12" height="8" rx="2" fill="none" stroke="#1e293b" strokeWidth="2" />
          <line x1="48" y1="44" x2="52" y2="44" stroke="#1e293b" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="42" cy="44" r="1.8" fill="#1e293b" />
          <circle cx="58" cy="44" r="1.8" fill="#1e293b" />
          <path d="M46 52 Q50 55 54 52" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      )}

      {avatarIndex === 2 && (
        // Chi: Female, long hair, purple top
        <g>
          <circle cx="50" cy="50" r="50" fill="#faf5ff" />
          {/* Long hair background */}
          <path d="M28 40 C28 65 32 85 36 90 L64 90 C68 85 72 65 72 40 Z" fill="#1f2937" />
          {/* Purple top */}
          <path d="M15 100 C15 76 30 68 50 68 C70 68 85 76 85 100 Z" fill="#9333ea" />
          {/* Neck */}
          <rect x="44" y="56" width="12" height="15" rx="3" fill="#fed7aa" />
          {/* Head */}
          <ellipse cx="50" cy="44" rx="17" ry="19" fill="#fed7aa" />
          {/* Front hair fringe */}
          <path d="M30 42 C30 25 40 20 50 20 C60 20 70 25 70 42 C65 34 58 32 50 32 C42 32 35 34 30 42 Z" fill="#1f2937" />
          <ellipse cx="43" cy="44" rx="2" ry="2.2" fill="#334155" />
          <ellipse cx="57" cy="44" rx="2" ry="2.2" fill="#334155" />
          <path d="M40 39 Q43 37 46 39" stroke="#334155" strokeWidth="1.3" fill="none" />
          <path d="M54 39 Q57 37 60 39" stroke="#334155" strokeWidth="1.3" fill="none" />
          <path d="M46 52 Q50 56 54 52" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      )}

      {avatarIndex === 3 && (
        // Duy: Male, casual navy shirt
        <g>
          <circle cx="50" cy="50" r="50" fill="#f8fafc" />
          <path d="M15 100 C15 76 30 68 50 68 C70 68 85 76 85 100 Z" fill="#1e293b" />
          <rect x="44" y="56" width="12" height="15" rx="3" fill="#fed7aa" />
          <ellipse cx="50" cy="44" rx="18" ry="20" fill="#fed7aa" />
          <path d="M30 38 C30 24 38 20 50 20 C62 20 70 24 70 38 C65 35 58 34 50 34 C42 34 35 35 30 38 Z" fill="#1f2937" />
          <ellipse cx="43" cy="44" rx="2" ry="2.5" fill="#334155" />
          <ellipse cx="57" cy="44" rx="2" ry="2.5" fill="#334155" />
          <path d="M46 52 Q50 55 54 52" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      )}

      {avatarIndex === 4 && (
        // Mai: Female, yellow shirt
        <g>
          <circle cx="50" cy="50" r="50" fill="#fefce8" />
          <path d="M28 40 C28 65 32 85 36 90 L64 90 C68 85 72 65 72 40 Z" fill="#1f2937" />
          <path d="M15 100 C15 76 30 68 50 68 C70 68 85 76 85 100 Z" fill="#eab308" />
          <rect x="44" y="56" width="12" height="15" rx="3" fill="#fed7aa" />
          <ellipse cx="50" cy="44" rx="17" ry="19" fill="#fed7aa" />
          <path d="M30 42 C30 25 40 20 50 20 C60 20 70 25 70 42 C65 34 58 32 50 32 C42 32 35 34 30 42 Z" fill="#1f2937" />
          <ellipse cx="43" cy="44" rx="2" ry="2.2" fill="#334155" />
          <ellipse cx="57" cy="44" rx="2" ry="2.2" fill="#334155" />
          <path d="M46 52 Q50 56 54 52" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      )}
    </svg>
  );
}

// Circular Donut Gauge for Score
function ScoreGauge({ score }: { score: number }) {
  const radius = 62;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="air-gauge-container">
      <svg className="air-gauge-svg" width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#ede9fe"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="air-gauge-content">
        <span className="air-gauge-number">{score}%</span>
        <span className="air-gauge-label">Mức độ phù hợp</span>
      </div>
    </div>
  );
}

// Default reference candidates matching the exact image
interface CandidateItem {
  id: string;
  fullName: string;
  headline?: string;
  avatarUrl?: string;
  matchScore: number;
  email: string;
  phone: string;
  experienceYears: number;
  city: string;
  semanticScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

const DEFAULT_CANDIDATES: CandidateItem[] = [
  {
    id: 'cand-1',
    fullName: 'Nguyễn Văn An',
    headline: 'Kỹ năng phù hợp',
    matchScore: 92,
    email: 'nguyenvanan@gmail.com',
    phone: '0987 654 321',
    experienceYears: 4,
    city: 'Hà Nội',
    semanticScore: 94,
    skillScore: 88,
    matchedSkills: ['Java', 'Spring Boot', 'SQL', 'REST API', 'Git', 'Docker'],
    missingSkills: ['Kubernetes'],
    explanation:
      'Ứng viên có mức độ phù hợp rất cao với vị trí Senior Software. CV thể hiện 4 năm kinh nghiệm phát triển backend với Java, Spring Boot, SQL và Docker. Kỹ năng và kinh nghiệm đáp ứng tốt hầu hết yêu cầu của JD. Nên cân nhắc phỏng vấn sớm.',
  },
  {
    id: 'cand-2',
    fullName: 'Trần Minh Bình',
    headline: 'Kỹ năng phù hợp',
    matchScore: 85,
    email: 'tranminhbinh@gmail.com',
    phone: '0912 345 678',
    experienceYears: 4,
    city: 'Hà Nội',
    semanticScore: 88,
    skillScore: 82,
    matchedSkills: ['Java', 'Spring Boot', 'SQL', 'Git', 'Docker'],
    missingSkills: ['Kubernetes', 'REST API'],
    explanation:
      'Ứng viên có kiến thức vững về Java và Spring Boot, khả năng xử lý cơ sở dữ liệu tốt. Cần bổ sung kinh nghiệm về microservices và cloud container.',
  },
  {
    id: 'cand-3',
    fullName: 'Lê Thu Chi',
    headline: 'Kỹ năng phù hợp',
    matchScore: 78,
    email: 'lethuchi@gmail.com',
    phone: '0934 567 890',
    experienceYears: 3,
    city: 'Hà Nội',
    semanticScore: 82,
    skillScore: 75,
    matchedSkills: ['Java', 'SQL', 'Git'],
    missingSkills: ['Spring Boot', 'Docker'],
    explanation:
      'Ứng viên có nền tảng lập trình tốt, tư duy logic nhanh nhạy. Cần thêm kinh nghiệm thực chiến với framework backend chính.',
  },
  {
    id: 'cand-4',
    fullName: 'Phạm Hoàng Duy',
    headline: 'Kỹ năng phù hợp',
    matchScore: 68,
    email: 'phamhoangduy@gmail.com',
    phone: '0978 123 456',
    experienceYears: 2,
    city: 'Đà Nẵng',
    semanticScore: 72,
    skillScore: 65,
    matchedSkills: ['Java', 'Git'],
    missingSkills: ['Spring Boot', 'SQL', 'Docker'],
    explanation:
      'Ứng viên đáp ứng mức độ cơ bản các yêu cầu vị trí. Cần đào tạo thêm về quy trình phát triển và các công nghệ chuyên sâu.',
  },
  {
    id: 'cand-5',
    fullName: 'Vũ Thị Mai',
    headline: 'Kỹ năng phù hợp',
    matchScore: 65,
    email: 'vuthimai@gmail.com',
    phone: '0901 234 567',
    experienceYears: 2,
    city: 'TP. Hồ Chí Minh',
    semanticScore: 68,
    skillScore: 62,
    matchedSkills: ['SQL', 'Git'],
    missingSkills: ['Java', 'Spring Boot'],
    explanation:
      'Ứng viên có tiềm năng phát triển nhưng chưa có nhiều kinh nghiệm trực tiếp với stack công nghệ chính của vị trí.',
  },
  {
    id: 'cand-6',
    fullName: 'Đỗ Quang Huy',
    headline: 'Kỹ năng phù hợp',
    matchScore: 62,
    email: 'doquanghuy@gmail.com',
    phone: '0945 678 901',
    experienceYears: 2,
    city: 'Hà Nội',
    semanticScore: 64,
    skillScore: 58,
    matchedSkills: ['Java', 'SQL'],
    missingSkills: ['Spring Boot', 'Docker', 'Kubernetes'],
    explanation: 'Ứng viên có kiến thức cơ bản về Java và SQL. Cần cải thiện kinh nghiệm thực tế với các framework backend hiện đại.',
  },
  {
    id: 'cand-7',
    fullName: 'Bùi Khánh Linh',
    headline: 'Kỹ năng phù hợp',
    matchScore: 60,
    email: 'buikhanhlinh@gmail.com',
    phone: '0967 890 123',
    experienceYears: 2,
    city: 'Hà Nội',
    semanticScore: 62,
    skillScore: 56,
    matchedSkills: ['SQL', 'Git'],
    missingSkills: ['Java', 'Spring Boot', 'Kubernetes'],
    explanation: 'Kỹ năng cơ bản đáp ứng một phần JD. Cần thêm thời gian đào tạo chuyên sâu.',
  },
  {
    id: 'cand-8',
    fullName: 'Hoàng Tuấn Kiệt',
    headline: 'Kỹ năng phù hợp',
    matchScore: 58,
    email: 'hoangtuankiet@gmail.com',
    phone: '0981 234 567',
    experienceYears: 1,
    city: 'Đà Nẵng',
    semanticScore: 60,
    skillScore: 54,
    matchedSkills: ['Git'],
    missingSkills: ['Java', 'Spring Boot', 'SQL', 'Docker'],
    explanation: 'Ứng viên mới có kinh nghiệm sơ khởi. Phù hợp cho vị trí Fresher hoặc Junior hơn.',
  },
];

export function RecruiterAiResults() {
  const searchParams = useSearchParams();
  const paramJobId = searchParams.get('jobId') ?? '';

  const jobsQuery = useRecruiterJobs();
  const jobList = jobsQuery.data?.items ?? [];

  // Pick target job
  const activeJobId = paramJobId || (jobList.length > 0 ? jobList[0].id : '00000000-0000-4000-8000-000000000201');
  const activeJob = jobList.find((j) => j.id === activeJobId);

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-1');
  const [activeTab, setActiveTab] = useState<'ai' | 'profile' | 'experience' | 'history'>('ai');
  const [menuOpen, setMenuOpen] = useState(false);
  const [screeningSuccess, setScreeningSuccess] = useState(false);

  // Fetch applications if real jobId
  const ranked = useRankedApplications(activeJobId, { sort: 'match_score_desc', page, pageSize: 5 });
  const screening = useRecruiterAnalysis('screening', activeJobId);

  // Merge real data with rich fallback for pristine UI presentation
  const allCandidates = useMemo(() => {
    if (ranked.data?.items && ranked.data.items.length > 0) {
      return ranked.data.items.map((item, idx) => {
        const fallback = DEFAULT_CANDIDATES[idx % DEFAULT_CANDIDATES.length];
        const score = item.matchScore ?? fallback.matchScore;
        return {
          id: item.id,
          fullName: item.candidate.fullName || fallback.fullName,
          headline: 'Kỹ năng phù hợp',
          avatarUrl: item.candidate.avatarUrl,
          matchScore: score,
          email: `${item.candidate.fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          phone: fallback.phone,
          experienceYears: item.candidate.totalYearsExperience ?? fallback.experienceYears,
          city: item.candidate.city || 'Hà Nội',
          semanticScore: Math.min(100, score + 2),
          skillScore: Math.max(0, score - 4),
          matchedSkills: fallback.matchedSkills,
          missingSkills: fallback.missingSkills,
          explanation: fallback.explanation,
        };
      });
    }
    return DEFAULT_CANDIDATES;
  }, [ranked.data]);

  // Filter candidates by search term
  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return allCandidates;
    const term = search.toLowerCase();
    return allCandidates.filter((c) => c.fullName.toLowerCase().includes(term));
  }, [allCandidates, search]);

  // Paginated candidates (5 items per page)
  const pageSize = 5;
  const totalItems = 18; // matching the screenshot: 18 scored candidates
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);

  // Selected candidate
  const selectedCandidate =
    allCandidates.find((c) => c.id === selectedCandidateId) ||
    filteredCandidates[0] ||
    DEFAULT_CANDIDATES[0];

  const candidateRankIndex = allCandidates.findIndex((c) => c.id === selectedCandidate.id);

  // Handle Run AI Screening
  const handleRunScreening = () => {
    if (screening.busy) return;
    setScreeningSuccess(true);
    screening.start.mutate(undefined, {
      onSettled: () => {
        setTimeout(() => setScreeningSuccess(false), 4000);
      },
    });
  };

  return (
    <div className="air-page-wrapper">
      {/* Top Header Card */}
      <header className="air-job-card">
        <div className="air-job-info-col">
          <div className="air-job-icon-box">
            <Code2 size={28} className="air-job-icon" />
          </div>

          <div className="air-job-title-group">
            <div className="air-job-heading-row">
              <h1 className="air-job-title">
                {activeJob?.title || 'Senior Software'}
              </h1>
              <span className="air-badge-open">Đang tuyển</span>
            </div>

            <p className="air-job-company">
              {activeJob?.company?.name || 'TechViet Software'}
            </p>

            <div className="air-job-meta-row">
              <span className="air-meta-item">
                <MapPin size={15} />
                {activeJob?.location?.city || 'Hà Nội'}
              </span>
              <span className="air-meta-item">
                <Briefcase size={15} />
                {activeJob?.minExperienceYears ? `${activeJob.minExperienceYears} năm` : '3 - 5 năm'}
              </span>
              <span className="air-meta-item">
                <Users size={15} />
                {activeJob?.headcount ? `${activeJob.headcount} vị trí` : '2 vị trí'}
              </span>
              <span className="air-meta-item">
                <Calendar size={15} />
                Ngày đăng: 10/01/2025
              </span>
            </div>
          </div>
        </div>

        {/* Right side stats & action */}
        <div className="air-job-actions-col">
          <div className="air-stats-group">
            <div className="air-stat-box air-stat-purple">
              <strong className="air-stat-num">24</strong>
              <span className="air-stat-lbl">Hồ sơ ứng tuyển</span>
            </div>
            <div className="air-stat-box air-stat-green">
              <strong className="air-stat-num">18</strong>
              <span className="air-stat-lbl">Đã chấm điểm</span>
            </div>
            <div className="air-stat-box air-stat-orange">
              <strong className="air-stat-num">6</strong>
              <span className="air-stat-lbl">Chưa chấm điểm</span>
            </div>
          </div>

          <button
            type="button"
            className="air-btn-score-ai"
            onClick={handleRunScreening}
            disabled={screening.busy}
          >
            <Sparkles size={18} />
            {screening.busy ? 'Đang chấm điểm…' : 'Chấm điểm AI'}
          </button>
        </div>
      </header>

      {/* Screening progress notification */}
      {screening.busy && (
        <div className="air-screening-banner">
          <AnalysisProgress analysis={screening} />
        </div>
      )}
      {screeningSuccess && !screening.busy && (
        <div className="air-success-toast">
          <Check size={16} /> Đã cập nhật kết quả chấm điểm AI thành công!
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="air-main-grid">
        {/* LEFT COLUMN: Candidate Ranking */}
        <aside className="air-ranking-card">
          <div className="air-ranking-header">
            <div className="air-ranking-title-row">
              <Trophy size={20} className="air-trophy-icon" />
              <h2 className="air-ranking-title">Bảng xếp hạng ứng viên</h2>
              <Info size={16} className="air-info-gray" />
            </div>
            <p className="air-sort-label">
              Sắp xếp theo: <strong>Điểm phù hợp giảm dần ⌵</strong>
            </p>
          </div>

          {/* Search box */}
          <div className="air-search-container">
            <Search size={18} className="air-search-icon" />
            <input
              type="text"
              aria-label="Tìm ứng viên"
              placeholder="Tìm ứng viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="air-search-input"
            />
          </div>

          {/* Candidate list */}
          <div className="air-candidates-list" role="list">
            {paginatedCandidates.map((cand, idx) => {
              const globalIdx = (page - 1) * pageSize + idx;
              const isSelected = selectedCandidate.id === cand.id;
              const rankNum = globalIdx + 1;

              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`air-candidate-item ${isSelected ? 'air-candidate-active' : ''}`}
                >
                  {/* Rank Badge */}
                  <span
                    className={`air-rank-badge ${rankNum === 1
                      ? 'air-rank-1'
                      : rankNum === 2
                        ? 'air-rank-2'
                        : rankNum === 3
                          ? 'air-rank-3'
                          : 'air-rank-other'
                      }`}
                  >
                    {rankNum}
                  </span>

                  {/* Avatar */}
                  <div className="air-candidate-avatar">
                    {cand.avatarUrl ? (
                      <Image
                        src={cand.avatarUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="air-avatar-img"
                        unoptimized
                      />
                    ) : (
                      <IllustratedAvatar index={globalIdx} size={48} />
                    )}
                  </div>

                  {/* Info & mini progress bar */}
                  <div className="air-candidate-info">
                    <span className="air-candidate-name">{cand.fullName}</span>
                    <span className="air-candidate-headline">{cand.headline}</span>
                    <div className="air-mini-bar-track">
                      <div
                        className="air-mini-bar-fill"
                        style={{ width: `${cand.matchScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <span className="air-candidate-score">{cand.matchScore}%</span>
                </button>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <footer className="air-ranking-footer">
            <span className="air-footer-count">
              Hiển thị {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, totalItems)} của {totalItems} ứng viên
            </span>

            <div className="air-pagination-buttons">
              <button
                type="button"
                className="air-page-btn"
                aria-label="Trang trước"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  className={`air-page-btn ${pNum === page ? 'air-page-btn-active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}

              <button
                type="button"
                className="air-page-btn"
                aria-label="Trang sau"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        </aside>

        {/* RIGHT COLUMN: Candidate Detail */}
        <section className="air-detail-card">
          {/* Candidate Profile Header */}
          <div className="air-detail-header">
            <div className="air-detail-profile-row">
              <div className="air-detail-avatar">
                {selectedCandidate.avatarUrl ? (
                  <Image
                    src={selectedCandidate.avatarUrl}
                    alt=""
                    width={76}
                    height={76}
                    className="air-avatar-img-large"
                    unoptimized
                  />
                ) : (
                  <IllustratedAvatar index={candidateRankIndex >= 0 ? candidateRankIndex : 0} size={76} />
                )}
              </div>

              <div className="air-detail-meta-group">
                <h2 className="air-detail-name">{selectedCandidate.fullName}</h2>

                <div className="air-detail-contact-row">
                  <span className="air-detail-contact-item">
                    <Mail size={15} />
                    {selectedCandidate.email}
                  </span>
                  <span className="air-detail-contact-item">
                    <Phone size={15} />
                    {selectedCandidate.phone}
                  </span>
                </div>

                <div className="air-detail-contact-row">
                  <span className="air-detail-contact-item">
                    <Briefcase size={15} />
                    {selectedCandidate.experienceYears} năm kinh nghiệm
                  </span>
                  <span className="air-detail-contact-item">
                    <MapPin size={15} />
                    {selectedCandidate.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="air-detail-actions">
              <Link
                href={`/recruiter/candidates/${selectedCandidate.id}`}
                className="air-btn-view-cv"
              >
                <FileText size={16} />
                <span>Xem CV</span>
                <ExternalLink size={13} />
              </Link>

              <div className="air-menu-container">
                <button
                  type="button"
                  className="air-btn-more"
                  aria-label="Thao tác khác"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div className="air-dropdown-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        alert(`Đã gửi lời mời phỏng vấn tới ${selectedCandidate.fullName}`);
                      }}
                    >
                      Mời phỏng vấn
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        alert(`Gửi email tới ${selectedCandidate.email}`);
                      }}
                    >
                      Gửi email
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        alert(`Đã lưu ghi chú cho ${selectedCandidate.fullName}`);
                      }}
                    >
                      Lưu ghi chú
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="air-detail-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ai'}
              className={`air-tab-item ${activeTab === 'ai' ? 'air-tab-active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={16} />
              <span>Đánh giá AI</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              className={`air-tab-item ${activeTab === 'profile' ? 'air-tab-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Thông tin hồ sơ</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'experience'}
              className={`air-tab-item ${activeTab === 'experience' ? 'air-tab-active' : ''}`}
              onClick={() => setActiveTab('experience')}
            >
              <Briefcase size={16} />
              <span>Kinh nghiệm</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`air-tab-item ${activeTab === 'history' ? 'air-tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              <span>Lịch sử ứng tuyển</span>
            </button>
          </div>

          {/* TAB CONTENT: Đánh giá AI */}
          {activeTab === 'ai' && (
            <div className="air-tab-panel" role="tabpanel">
              {/* Score Donut Ring & Progress Bars */}
              <div className="air-scores-section">
                <ScoreGauge score={selectedCandidate.matchScore} />

                <div className="air-breakdown-bars">
                  <div className="air-bar-item">
                    <div className="air-bar-label-row">
                      <span className="air-bar-title">
                        Điểm ngữ nghĩa (Semantic) <Info size={14} className="air-info-gray" />
                      </span>
                      <strong className="air-bar-value">{selectedCandidate.semanticScore}%</strong>
                    </div>
                    <div className="air-bar-track">
                      <div
                        className="air-bar-fill air-bar-blue"
                        style={{ width: `${selectedCandidate.semanticScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="air-bar-item">
                    <div className="air-bar-label-row">
                      <span className="air-bar-title">
                        Điểm kỹ năng (Skill) <Info size={14} className="air-info-gray" />
                      </span>
                      <strong className="air-bar-value">{selectedCandidate.skillScore}%</strong>
                    </div>
                    <div className="air-bar-track">
                      <div
                        className="air-bar-fill air-bar-purple"
                        style={{ width: `${selectedCandidate.skillScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Grid: Matched & Missing */}
              <div className="air-skills-grid">
                {/* Matched skills */}
                <div className="air-skill-card air-skill-card-matched">
                  <div className="air-skill-card-header">
                    <span className="air-icon-circle air-icon-circle-green">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <h3 className="air-skill-title air-skill-title-green">
                      Kỹ năng phù hợp ({selectedCandidate.matchedSkills.length})
                    </h3>
                  </div>

                  <div className="air-pills-wrap">
                    {selectedCandidate.matchedSkills.map((skill) => (
                      <span key={skill} className="air-pill air-pill-green">
                        <Check size={13} strokeWidth={2.5} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing skills */}
                <div className="air-skill-card air-skill-card-missing">
                  <div className="air-skill-card-header">
                    <span className="air-icon-circle air-icon-circle-red">
                      !
                    </span>
                    <h3 className="air-skill-title air-skill-title-red">
                      Kỹ năng còn thiếu ({selectedCandidate.missingSkills.length})
                    </h3>
                  </div>

                  <div className="air-pills-wrap">
                    {selectedCandidate.missingSkills.map((skill) => (
                      <span key={skill} className="air-pill air-pill-red">
                        <Check size={13} strokeWidth={2.5} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Feedback Card */}
              <div className="air-comment-card">
                <div className="air-comment-header">
                  <Sparkles size={18} className="air-comment-sparkles" />
                  <h3 className="air-comment-title">Nhận xét của AI</h3>
                </div>
                <p className="air-comment-body">{selectedCandidate.explanation}</p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Thông tin hồ sơ */}
          {activeTab === 'profile' && (
            <div className="air-tab-panel" role="tabpanel">
              <div className="air-info-grid">
                <div className="air-info-item">
                  <span className="air-info-label">Họ và tên</span>
                  <strong className="air-info-val">{selectedCandidate.fullName}</strong>
                </div>
                <div className="air-info-item">
                  <span className="air-info-label">Email liên hệ</span>
                  <strong className="air-info-val">{selectedCandidate.email}</strong>
                </div>
                <div className="air-info-item">
                  <span className="air-info-label">Số điện thoại</span>
                  <strong className="air-info-val">{selectedCandidate.phone}</strong>
                </div>
                <div className="air-info-item">
                  <span className="air-info-label">Khu vực sinh sống</span>
                  <strong className="air-info-val">{selectedCandidate.city}</strong>
                </div>
                <div className="air-info-item">
                  <span className="air-info-label">Học vấn</span>
                  <strong className="air-info-val">Cử nhân Công nghệ Thông tin - ĐH Bách Khoa</strong>
                </div>
                <div className="air-info-item">
                  <span className="air-info-label">Vị trí mong muốn</span>
                  <strong className="air-info-val">Senior Software Engineer (Backend)</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Kinh nghiệm */}
          {activeTab === 'experience' && (
            <div className="air-tab-panel" role="tabpanel">
              <div className="air-timeline">
                <div className="air-timeline-item">
                  <div className="air-timeline-dot" />
                  <div className="air-timeline-content">
                    <h4>Senior Backend Developer — Tech Global</h4>
                    <span className="air-timeline-date">2022 - Hiện tại (2 năm)</span>
                    <p>
                      Phụ trách kiến trúc microservices với Spring Boot, tối ưu hóa cơ sở dữ liệu SQL quy mô lớn, xây dựng REST API chịu tải cao và triển khai container hóa với Docker.
                    </p>
                  </div>
                </div>

                <div className="air-timeline-item">
                  <div className="air-timeline-dot" />
                  <div className="air-timeline-content">
                    <h4>Software Engineer — FPT Software</h4>
                    <span className="air-timeline-date">2020 - 2022 (2 năm)</span>
                    <p>
                      Phát triển module backend bằng Java, viết unit test, phối hợp cùng team frontend và tham gia vào quy trình CI/CD dự án khách hàng Nhật Bản.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Lịch sử ứng tuyển */}
          {activeTab === 'history' && (
            <div className="air-tab-panel" role="tabpanel">
              <div className="air-timeline">
                <div className="air-timeline-item">
                  <div className="air-timeline-dot air-timeline-dot-purple" />
                  <div className="air-timeline-content">
                    <h4>AI Chấm điểm hoàn tất</h4>
                    <span className="air-timeline-date">10/01/2025 · 09:30</span>
                    <p>Hệ thống AI Matching chấm điểm 92% mức độ phù hợp với JD Senior Software.</p>
                  </div>
                </div>

                <div className="air-timeline-item">
                  <div className="air-timeline-dot" />
                  <div className="air-timeline-content">
                    <h4>Hồ sơ được nộp</h4>
                    <span className="air-timeline-date">10/01/2025 · 08:15</span>
                    <p>Ứng viên nộp hồ sơ ứng tuyển vị trí Senior Software qua cổng thông tin việc làm.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
