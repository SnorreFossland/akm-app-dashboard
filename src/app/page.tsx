"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RootState } from "@/store";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Header from "@/components/Header";

// import { FeatureAComponent } from '@/features';
import { Card } from "@/components/ui/card";
// const components = [<ModelComponent key="model" />, <ConceptBuilder key="builder" />];



export default function Home() {
  const data = useSelector((state: RootState) => state.modelUniverse);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slide1 = (
    <div className="flex flex-row items-center justify-between h-full p-2 md:p-2 gap-4 max-w-7xl mx-auto ">
      <div className="flex flex-col items-left justify-start space-y-2 md:space-y-4 text-sm md:text-xl p-4 w-full md:w-1/3  p-4 bg-gradient-to-r from-green-950 to-blue-1000">
        <div className="font-semibold bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent">
          AI Powered - Active Knowledge Modelling (AKM). <br />
          Using AI to help building a Active Knowledge Models - consisting of various models exploring different aspects of the Domain.
        </div>
        <div className="text-cyan-300 text-sm md:text-lg p-4 bg-gradient-to-r from-green-950 to-blue-1000">
          Vi start with scoping and defining the Domain we are going to explore and model. <br />
          This includes:
          <ul className="list-disc pl-4 mt-1">
            <li className="whitespace-normal break-words mb-1">
              <Link href="/prompt-builder" className="hover:text-blue-400 transition-colors">
                Generate a super Prompt to in-depth explore the Domain in question.
              </Link>
            </li>
            <li className="whitespace-normal break-words mb-1">
              <Link href="/domain-builder" className="hover:text-blue-400 transition-colors">
                Run the Prompt to let AI generate the Scope definition.
              </Link>
            </li>
            <li className="whitespace-normal break-words mb-1">
              <Link href="/concept-builder" className="hover:text-blue-400 transition-colors">
                AI generated Domain Ontology (Knowledge Graph).
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center w-full md:w-1/3 aspect-square ">
        <div className="relative w-full max-w-xs aspect-square rounded-full border-4 border-green-500 shadow-lg flex items-center justify-center">
          <div className="relative w-full h-full m-1 rounded-full border-4 border-blue-500 shadow-lg flex items-center justify-center">
            {/* Image visible for the first half of the cycle */}
            <div
              style={{ animation: "fadeInOut 10s ease-in-out infinite" }}
              className="absolute"
            >
              <style jsx>{`
                @keyframes fadeInOut {
                  0% { opacity: 1; }
                  45% { opacity: 0; }
                  55% { opacity: 0; }
                  100% { opacity: 1; }
                }
              `}</style>
              <Image
                src="/images/earthbox.png"
                alt="Active AI Powered Knowledge Models"
                width={222}
                height={222}
                className="object-cover rounded-full w-full h-full"
              />
            </div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 animate-[pulse_5s_linear_infinite]"></div>
            <div className="flex flex-col items-center z-10">
              <span className="relative p-2 md:p-4 text-center text-lg md:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 animate-[pulse_1s_linear_infinite] bg-clip-text text-transparent">
                AI Powered
              </span>
              <span className="relative p-2 md:p-4 text-center text-lg md:text-3xl lg:text-4xl font-semibold bg-gradient-to-l from-green-400 to-blue-500 animate-[pulse_5s_linear_infinite] bg-clip-text text-transparent">
                Active Knowledge Models
              </span>
            </div>
            <div
              style={{
                animation: "fadeInOut 20s ease-in-out infinite reverse, moveAround 30s linear infinite"
              }}
              className="absolute"
            >
              <style jsx>{`
              @keyframes fadeInOut {
              0% { opacity: 1; }
              45% { opacity: 0; }
              55% { opacity: 0; }
              100% { opacity: 1; }
              }
              @keyframes moveAround {
              0% { transform: translate(0px, 0px); }
              20% { transform: translate(50px, -35px); }
              40% { transform: translate(-40px, -30px); }
              60% { transform: translate(-50px, 40px); }
              80% { transform: translate(40px, 30px); }
              100% { transform: translate(0px, 0px); }
              }
              @keyframes changeColors {
              0% { color: #b91c1c; }
              25% { color: #4f46e5; }
              50% { color: #0ea5e9; }
              75% { color: #059669; }
              100% { color: #b91c1c; }
              }
              @keyframes changeSize {
              0% { transform: scale(1); }
              50% { transform: scale(1.5); }
              100% { transform: scale(1); }
              }
              `}</style>
              <FontAwesomeIcon
                icon={faRobot}
                className="fa-2xl"
                style={{ animation: "changeColors 18s linear infinite, changeSize 8s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-left justify-left space-y-2 md:space-y-4 text-sm md:text-xl p-2 w-full md:w-1/3  p-4 bg-gradient-to-l from-green-950 to-blue-1000">
        <div className="font-semibold bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent">
          This model suite, can consist of: <br />Top-down overview models, Workspace models and<br />Bottom-up Solution models, <br />as a collection of models. <br />
          The models are used to explore the Domain and generate insights and knowledge for the Domain in question.
        </div>
        <div className="text-cyan-300 text-sm md:text-lg p-2 bg-gradient-to-l from-green-950 to-blue-1000">
          Based on the Domain Scope definition, we generate specific model objects and relationships that form the foundation of our AKM models. The AI analyzes the domain knowledge and automatically creates suggestions:
          <ul className="list-disc pl-4 mt-1 text-cyan-300">
            <li className="whitespace-normal break-words mb-1">
              <Link href="/model-builder" className="hover:text-blue-400 transition-colors">
                AI Generated IRTV Model
              </Link>
            </li>
            <li className="whitespace-normal break-words mb-1">
              <Link href="/model-builder" className="hover:text-blue-400 transition-colors">
                AI Generated POPS Model
              </Link>
            </li>
            <li className="whitespace-normal break-words mb-1">
              <Link href="/model-builder" className="hover:text-blue-400 transition-colors">
                AI Generated META Model
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const slide2 = (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col items-left space-y-4">
        <div className="text-4xl font-semibold text-blue-700">Active AI Powered Knowledge Models</div>
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 animate-pulse"></div>
        <div className="text-sm text-gray-700 space-y-1">
          <div>Info 1: Overview</div>
          <div>Info 2: Details</div>
          <div>Info 3: More Info</div>
        </div>
      </div>
    </div>
  );

  const components = [slide1, slide2];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === components.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? components.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <Header metisName={data.phData.metis.name} />
      <div className="my-5 py-5">
        <div className="flex items-center justify-center h-full overflow-hidden">
          <button
            onClick={prevSlide}
            className="flex-shrink-0 mr-4 bg-white/10 rounded-full p-2 shadow-md hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative flex flex-1 items-center justify-center">
            <div
              className="flex transition-transform duration-300 h-full w-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {components.map((component, index) => (
                <div
                  key={index}
                  className="min-w-full h-full flex items-center justify-center flex-shrink-0"
                >
                  {component}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="flex-shrink-0 ml-4 bg-white/20 rounded-full p-2 shadow-md hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      <div className="pt-1 h-[calc(100vh-34rem)] overflow-auto"> {/* Add padding to avoid overlap with fixed header */}
        <Tabs defaultValue="akm-project" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="akm-project">Model Projects</TabsTrigger>
            <TabsTrigger value="akm-objects">Model Objects</TabsTrigger>
          </TabsList>
          <TabsContent value="akm-project" className="bg-background w-full">
            <div className="flex gap-4 items-center flex-col sm:flex-row w-full h-full">
              <main className="flex flex-col gap-8 row-start-4 items-center sm:items-start w-full h-full">
                <Card className="w-full h-full">
                  {/* <FeatureAComponent /> */}
                </Card>
              </main>
            </div>
          </TabsContent>
          <TabsContent value="akm-objects" className="w-full ">
            <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
              <main className="flex flex-col gap-2 row-start-2 items-center sm:items-start">
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
                {/* <Image
                  className="dark:invert"
                  src="https://nextjs.org/icons/next.svg"
                  alt="Next.js logo"
                  width={180}
                  height={38}
                  priority
                /> */}
                <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                  <li className="mb-2">
                    Get started by editing{" "}
                    <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                      src/app/page.tsx
                    </code>
                  </li>
                  <li>Save and see your changes instantly.</li>
                </ol>
              </main>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
