import React, { useRef, Suspense } from "react";
import { useInView } from "motion/react";

const DotLottieReact = React.lazy(() =>
  import("@lottiefiles/dotlottie-react").then((module) => ({
    default: module.DotLottieReact,
  })),
);

interface LazyLottieProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export default function LazyLottie({
  src,
  loop = true,
  autoplay = true,
  className,
}: LazyLottieProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });

  return (
    <div
      ref={ref}
      className={className || "w-full h-full flex items-center justify-center"}
    >
      {isInView ? (
        <Suspense
          fallback={
            <div className="animate-pulse w-full h-full bg-primary/5 rounded-full" />
          }
        >
          <DotLottieReact src={src} loop={loop} autoplay={autoplay} />
        </Suspense>
      ) : (
        <div className="w-full h-full" />
      )}
    </div>
  );
}
