import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import SignatureDishes from "@/components/landing/SignatureDishes";
import MenuPreview from "@/components/landing/MenuPreview";
import Specials from "@/components/landing/Specials";
import Gallery from "@/components/landing/Gallery";
import Testimonials from "@/components/landing/Testimonials";
import ReservationForm from "@/components/landing/ReservationForm";
import Location from "@/components/landing/Location";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <SignatureDishes />
        <MenuPreview />
        <Specials />
        <Gallery />
        <Testimonials />
        <ReservationForm />
        <Location />
      </main>
      <Footer />
    </>
  );
}
