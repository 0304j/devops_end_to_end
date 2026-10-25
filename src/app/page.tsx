import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Approach } from "@/components/sections/approach";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="inhalt">
        <Hero />
        <Services />
        <Approach />
        <Process />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
