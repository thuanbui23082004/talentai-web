import type { components } from '@/lib/api/generated/schema';

export const jobPostingCatalogs: components['schemas']['JobPostingOptions'] = {
  categories: [{ categoryId: 1, categoryName: 'Software Engineering' }, { categoryId: 2, categoryName: 'Data and AI' }, { categoryId: 3, categoryName: 'Product and Design' }],
  skills: [{ skillId: 1, skillName: 'Java' }, { skillId: 2, skillName: 'React' }, { skillId: 3, skillName: 'TypeScript' }, { skillId: 4, skillName: 'Docker' }],
};
