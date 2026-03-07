"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getStoredCredentials } from "@/utils/fauna-auth-store";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const [hasAuth, setHasAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setHasAuth(!!getStoredCredentials());
  }, []);

  if (hasAuth === null) {
    return null;
  }

  if (!hasAuth) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[40vh]">
        <p className="text-gray-11 p">
          Auth is needed. Set your endpoint and secret on the Home page to use this section.
        </p>
        <Button asChild>
          <Link href="/">Go to Auth</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
