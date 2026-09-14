import ParticleTitle from "@/components/ParticleTitle";
import SealHologram from "@/components/SealHologram";
import VerifyStates from "@/components/VerifyStates";
import About from "@/components/About";
import Footer from "@/components/Footer";
import Faq from "@/components/Faq";
export default function Home() {
  return (
    <main className="relative">
            <section id="top" className="mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-24">
        <div className="grid w-full grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <ParticleTitle />
                      <p className="mt-8 max-w-xl text-xl font-medium leading-snug text-[#500414] md:text-2xl">
              Every authenticity label on the market can be defeated with a
              camera and a printer. Veymark puts a cryptographic chip on the
              part and its passport on Solana. The secret never appears on any
              screen, so there is nothing to photograph.
            </p>
          </div>

          <div className="order-first md:order-last">
            <SealHologram />
          </div>
        </div>
      </section>

                  <VerifyStates />
                  <About />
                        <Faq />
                        <Footer />
                              
    </main>
  );
}