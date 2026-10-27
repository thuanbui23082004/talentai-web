export type JobStatusAction = 'pause' | 'reopen' | 'close';
export function canChangeJobStatus(status: string, action: JobStatusAction) {
  return action === 'pause' ? status === 'open' : action === 'reopen' ? ['paused', 'closed'].includes(status) : ['open', 'paused'].includes(status);
}
