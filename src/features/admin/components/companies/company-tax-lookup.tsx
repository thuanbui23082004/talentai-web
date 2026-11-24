'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lookupCompanyTax } from '@/features/admin/services/companies';
import type { ManagedCompany } from '@/features/admin/schemas/companies';
import { adminKeys } from '@/features/admin/query-keys';

export function CompanyTaxLookup({ company }: { company: ManagedCompany }) {
  const [started, setStarted] = useState(false);
  const query = useQuery({ queryKey: adminKeys.companyTax(company.id, company.taxCode), queryFn: ({ signal }) => lookupCompanyTax(company.id, signal), enabled: started, retry: false });
  if (!company.taxCode) return <section className="admin-user-info"><h2>Đối chiếu mã số thuế</h2><p className="admin-muted">Doanh nghiệp chưa cung cấp mã số thuế.</p></section>;
  const tax = query.data;
  const matches = tax?.taxCode.replace(/\D/g, '') === company.taxCode.replace(/\D/g, '');
  return <section className="admin-user-info admin-company-tax"><div className="admin-section-heading"><h2>Đối chiếu mã số thuế</h2><Button variant="outline" disabled={query.isFetching} onClick={() => { setStarted(true); if (started) void query.refetch(); }}><SearchCheck size={17} />{query.isFetching ? 'Đang tra cứu…' : 'Tra cứu mã số thuế'}</Button></div>
    <p className="admin-muted">Đối chiếu thông tin đăng ký thuế với hồ sơ và giấy tờ doanh nghiệp trước khi xác minh.</p>
    {query.isPending && started && <div className="admin-skeleton" aria-busy="true"><span /><span /></div>}
    {query.error && <p role="alert" className="admin-error">Không tra cứu được mã số thuế này. Kiểm tra mã và thử lại; chưa nên xác minh công ty.</p>}
    {tax && <><p role="status" className={matches && tax.isActive ? 'admin-user-notice' : 'admin-error'}>{matches && tax.isActive ? <SearchCheck size={17} /> : <ShieldAlert size={17} />}{matches ? tax.isActive ? 'Mã số thuế khớp và doanh nghiệp đang hoạt động.' : 'Mã số thuế khớp nhưng trạng thái hoạt động cần kiểm tra.' : 'Mã số thuế trả về không khớp hồ sơ.'}</p><dl className="admin-user-fields"><div><dt>Mã số thuế đăng ký</dt><dd>{tax.taxCode}</dd></div><div><dt>Tên đăng ký</dt><dd>{tax.name}</dd></div><div><dt>Địa chỉ đăng ký</dt><dd>{tax.address || 'Chưa có'}</dd></div><div><dt>Trạng thái</dt><dd>{tax.status || 'Chưa có'}</dd></div><div><dt>Người đại diện</dt><dd>{tax.representative || 'Chưa có'}</dd></div><div><dt>Cơ quan thuế</dt><dd>{tax.taxDepartment || 'Chưa có'}</dd></div></dl></>}
  </section>;
}
