"use client";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import ShimmerButton from "@/components/ui/shimmer-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import {
  Code,
  Layout,
  Palette,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Modern Design",
      description: "Crafted with the latest design trends.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Palette className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Fast Performance",
      description: "Optimized for speed and efficiency.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Zap className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Secure",
      description: "Built with security in mind.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Shield className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Responsive",
      description: "Looks great on all devices.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Layout className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Developer Friendly",
      description: "Easy to customize and extend.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Code className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Scalable",
      description: "Ready for growth.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100" />,
      icon: <Rocket className="h-4 w-4 text-neutral-500" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AuroraBackground>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <TextGenerateEffect
            words="Experience the Future of Web Design"
            className="text-4xl md:text-7xl font-bold text-center text-neutral-800 dark:text-neutral-200 mb-8"
          />
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8 text-lg">
            Build stunning, modern websites with our premium components. Designed
            for developers who care about aesthetics and performance.
          </p>
          <div className="flex gap-4">
            <Link href="/docs">
              <ShimmerButton className="shadow-2xl">
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  Get Started
                </span>
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </AuroraBackground>

      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-neutral-800 dark:text-neutral-200">
            Features
          </h2>
          <BentoGrid className="max-w-4xl mx-auto">
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                icon={item.icon}
                className={i === 3 || i === 6 ? "md:col-span-2" : ""}
              />
            ))}
          </BentoGrid>
        </div>
      </section>
    </div>
  );
}
