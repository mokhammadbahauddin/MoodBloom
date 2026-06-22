import React from "react";
import {
  useAuthState,
  useSignInWithGoogle,
  useSignInWithEmailAndPassword,
  useCreateUserWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { Loader2 } from "lucide-react";
import LazyLottie from "./LazyLottie";
import { SmokeyBackground, LoginForm } from "./ui/login-form";

export default function AuthOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading, error] = useAuthState(auth);
  const [signInWithGoogle, , loadingGoogle, errorGoogle] =
    useSignInWithGoogle(auth);
  const [signInWithEmailAndPassword, , loadingEmailSignIn, errorEmailSignIn] =
    useSignInWithEmailAndPassword(auth);
  const [
    createUserWithEmailAndPassword,
    ,
    loadingEmailSignUp,
    errorEmailSignUp,
  ] = useCreateUserWithEmailAndPassword(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="w-32 h-32">
          <LazyLottie
            src="https://assets3.lottiefiles.com/packages/lf20_p8bfn5to.json"
            loop
            autoplay
          />
        </div>
      </div>
    );
  }

  if (!user) {
    const isAuthenticating =
      loadingGoogle || loadingEmailSignIn || loadingEmailSignUp;
    const authError =
      errorGoogle || errorEmailSignIn || errorEmailSignUp || error;

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8FAFC]">
        <SmokeyBackground />

        <div className="relative z-10 w-full flex flex-col items-center justify-center p-4">
          <LoginForm
            onGoogleSignIn={() => signInWithGoogle()}
            onEmailSignIn={(email, pass) =>
              signInWithEmailAndPassword(email, pass)
            }
            onEmailSignUp={(email, pass) =>
              createUserWithEmailAndPassword(email, pass)
            }
            isLoading={isAuthenticating}
          />

          {authError && (
            <div className="max-w-sm w-full mt-4 bg-error/90 backdrop-blur-md text-white px-4 py-3 rounded-lg text-sm font-medium border border-error shadow-lg">
              {authError.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>{children}</>
  );
}
