import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/appearance";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return <SignUp appearance={authAppearance} />;
}
