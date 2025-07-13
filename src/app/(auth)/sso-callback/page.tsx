"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

const SSOCallbackPage = () => {
  return <AuthenticateWithRedirectCallback />;
};

export default SSOCallbackPage;
