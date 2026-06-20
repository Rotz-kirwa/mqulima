import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface CropSlide {
  name: string;
  title: string;
  description: string;
  image: string;
  qualityTags: string[];
  availability: string;
  availabilityType: string;
  price: number;
  unit: string;
}

interface FeaturedCropsProps {
  cropSlides: CropSlide[];
  onOrderCrop: (name: string) => void;
}

export function FeaturedCrops({ cropSlides, onOrderCrop }: FeaturedCropsProps) {
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    if (!carouselApi) return;
    const timer = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselApi]);

  return (
    <div className="container-px mx-auto max-w-7xl mt-8 mb-8 text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1A6B3C]">Direct Farm Harvest</span>
          <h2 className="mt-1 text-lg font-black text-[#1A1A1A] md:text-xl tracking-tight uppercase">Featured Crops</h2>
        </div>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        setApi={setCarouselApi}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {cropSlides.map((item, idx) => (
            <CarouselItem key={idx} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div 
                onClick={() => onOrderCrop(item.name)}
                className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:border-[#1A6B3C] hover:shadow-md cursor-pointer aspect-[4/5]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  width={300}
                  height={375}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3 md:-left-12 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-[#1A1A1A] border border-[#E5E7EB] shadow-md hover:scale-105 transition-all duration-200 z-10" />
        <CarouselNext className="right-3 md:-right-12 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-[#1A1A1A] border border-[#E5E7EB] shadow-md hover:scale-105 transition-all duration-200 z-10" />
      </Carousel>
    </div>
  );
}
