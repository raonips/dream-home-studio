import { lazy, Suspense } from "react";
import HeroSection from "@/components/HeroSection";

const FeaturedProperties = lazy(() => import("@/components/FeaturedProperties"));
const TrustSection = lazy(() => import("@/components/TrustSection"));

const Index = () => {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<div className="min-h-[700px] md:min-h-[600px]" />}>
        <FeaturedProperties />
      </Suspense>
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <TrustSection />
      </Suspense>
    </>
  );
};

export default Index;
