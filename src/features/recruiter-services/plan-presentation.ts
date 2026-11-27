import { formatVND } from '@/lib/utils';
import type { SubscriptionPlan } from './types';

const FEATURE_LABELS: Record<string, string> = {
    MAX_POSTS: 'Tin tuyển dụng',
    JOB_DISPLAY_DAYS: 'Thời gian hiển thị tin',
    CV_SEARCH_LIMIT: 'Lượt tìm hồ sơ ứng viên',
    AI_MATCHING: 'Đối sánh CV với AI',
};

const numberFormat = new Intl.NumberFormat('vi-VN');

export function planFeatureLabel(key: string) {
    return FEATURE_LABELS[key] ?? key.replaceAll('_', ' ');
}

export function planFeatureValue(key: string, value: number | string | boolean | undefined) {
    if (value === undefined) return '—';
    if (value === true) return 'Có';
    if (value === false) return 'Không bao gồm';
    if (value === -1 || String(value).toUpperCase() === 'UNLIMITED') return 'Không giới hạn';
    const text = typeof value === 'number' ? numberFormat.format(value) : value;
    if (key === 'JOB_DISPLAY_DAYS') return `${text} ngày`;
    if (key === 'MAX_POSTS') return `${text} tin`;
    if (key === 'CV_SEARCH_LIMIT') return `${text} lượt`;
    return text;
}

export function planPrice(plan: SubscriptionPlan) {
    if (plan.price === 0) return 'Miễn phí';
    return plan.currency === 'VND' ? formatVND(plan.price) : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currency }).format(plan.price);
}
