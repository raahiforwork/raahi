import Navbar from "@/components/Navbar";
import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import HowItWorks from "@/components/Landing/HowItWorks";
import FAQ from "@/components/Landing/FAQ";

import Footer from "@/components/Landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
     
      <Footer />
    </main>
  );
}
