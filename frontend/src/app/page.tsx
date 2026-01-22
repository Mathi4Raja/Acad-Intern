import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  InternshipsSection,
  TestimonialsSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <InternshipsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
