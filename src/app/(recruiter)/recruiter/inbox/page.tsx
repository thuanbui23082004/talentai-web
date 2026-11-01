import { InboxPage } from '@/features/inbox';

import { inboxFixtures } from '@/mocks/fixtures/inbox';
export default function Page() { return <InboxPage initialMails={inboxFixtures} />; }
