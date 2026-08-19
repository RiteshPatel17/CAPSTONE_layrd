"use client";
import Image from "next/image";

const PRODUCT_SHOTS = [
  {
    key: "hero-shape-1",
    src: "/images/hero/can-1.png",
    delay: 0.15,
    width: 300,
    height: 450,
  },
  {
    key: "hero-shape-2",
    src: "/images/hero/can-2.png",
    delay: 0.35,
    width: 300,
    height: 450,
  },
];

export default function HeroShapes() {
  return (
    <div className="hero-shapes-frame" aria-hidden="true">
      <div className="hero-shapes">
        {PRODUCT_SHOTS.map((shot) => (
          <div
            key={shot.key}
            className={`hero-shape-wrap ${shot.key}`}
            style={{ animationDelay: `${shot.delay}s` }}
          >
            <div className="hero-shape-float">
              <div className="hero-shape-ground" />
              <Image
                src={shot.src}
                alt=""
                width={shot.width}
                height={shot.height}
                className="hero-shape-can"
                priority
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}