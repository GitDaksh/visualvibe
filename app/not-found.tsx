import Link from "next/link";
import { StatusHeading, StatusScreen } from "@/components/meeting/screens";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusScreen homeHref="/">
      <StatusHeading title="This page doesn't exist" body="The link may be old or mistyped." />
      <Button asChild variant="primary" size="lg">
        <Link href="/">Go to VisualVibe</Link>
      </Button>
    </StatusScreen>
  );
}
