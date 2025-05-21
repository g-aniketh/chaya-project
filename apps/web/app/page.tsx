import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
export default function Home() {
  return (
    <div>
      Chaya Website
      <Link href="/login" passHref>
        <Button>Go to login</Button>
      </Link>
    </div>
  );
}
