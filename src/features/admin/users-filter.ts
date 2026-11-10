import type { ManagedUser } from '@/features/admin/schemas/users';
export function filterUsers(users: ManagedUser[], search: string, role: string, status: string) {
  const q = search.trim().toLocaleLowerCase('vi');
  return users.filter(user => user.role !== 'admin' && (!role || user.role === role) && (!status || user.status === status) && (!q || user.fullName.toLocaleLowerCase('vi').includes(q) || user.email.toLocaleLowerCase('vi').includes(q)));
}
