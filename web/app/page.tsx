"use client";

import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Scale, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* SECTION 1: HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] text-center px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-20 z-0 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            The Future of Freelancing is <span className="text-gradient">Trustless</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Verico brings security, transparency, and fairness to the gig economy using the Cardano blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              as={Link}
              href="/gigs"
              color="primary"
              size="lg"
              className="font-semibold text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              endContent={<ArrowRight size={20} />}
            >
              Explore Gigs
            </Button>
            <Button
              as={Link}
              href="/projects/create"
              variant="bordered"
              size="lg"
              className="font-semibold border-white/20 hover:bg-white/5"
            >
              Post a Project
            </Button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Verico?</h2>
          <p className="text-muted-foreground text-lg">Built for professionals who demand security.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="w-10 h-10 text-primary" />}
            title="Secure Escrow"
            description="Funds are locked in smart contracts upon project acceptance. Payment is guaranteed upon successful delivery."
          />
          <FeatureCard
            icon={<Scale className="w-10 h-10 text-primary" />}
            title="Fair Dispute Resolution"
            description="A hybrid system of AI and human arbitration ensures that every dispute is handled fairly and efficiently."
          />
          <FeatureCard
            icon={<UserCheck className="w-10 h-10 text-primary" />}
            title="Verified Identity"
            description="On-chain reputation and identity verification build trust between clients and freelancers."
          />
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="container mx-auto px-6 py-20 bg-white/5 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">A seamless workflow from start to finish.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          <StepCard number="01" title="Connect Wallet" description="Sign in with your Cardano wallet to create your profile." />
          <StepCard number="02" title="Find or Post" description="Browse gigs or post your project requirements." />
          <StepCard number="03" title="Escrow & Work" description="Funds are secured. Work begins with peace of mind." />
          <StepCard number="04" title="Complete" description="Approve work and release funds instantly." />
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Card className="glass-card border-primary/20 bg-gradient-to-br from-card to-background overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <CardBody className="py-20 px-8 flex flex-col items-center gap-8 relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold max-w-3xl">
              Ready to Experience the <span className="text-primary">Next Level</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Join thousands of freelancers and clients building the future of work on Verico.
            </p>
            <Button
              as={Link}
              href="/gigs"
              color="primary"
              size="lg"
              className="font-bold text-lg px-12 py-8 text-black shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            >
              Get Started Now
            </Button>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full glass-card border-white/5 hover:border-primary/30 transition-colors">
        <CardHeader className="pt-8 px-8 pb-0">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            {icon}
          </div>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <h3 className="text-xl font-bold mb-3">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </CardBody>
      </Card>
    </motion.div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card/30 border border-white/5 hover:bg-card/50 transition-colors">
      <span className="text-5xl font-bold text-white/10">{number}</span>
      <h3 className="text-xl font-bold text-primary">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
