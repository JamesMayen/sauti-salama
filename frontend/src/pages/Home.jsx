import Hero from "../components/home/Hero";
import ProblemSection from "../components/home/ProblemSection";
import HowItWorks from "../components/home/HowItWorks";
import Features from "../components/home/Features";
import LowBandwidth from "../components/home/LowbandWidth.jsx";
import CallToAction from "../components/home/CallToAction";

function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <LowBandwidth />
      <CallToAction />
    </>
  );
}

export default Home;