import Image from "next/image";
/**
 * A safe, database-ready media component for Wholesale pages.
 * Displays a fixed aspect-ratio rectangular image, or a safe fallback if the image URL is missing.
 */
export default function WholesaleMedia({ src, alt = "LÄYRD Wholesale", priority = false, variant = "hero" }) {
  const containerStyle = variant === "hero"
    ? { width: "100%", aspectRatio: "4/3", maxHeight: "430px", position: "relative", overflow: "hidden", borderRadius: "4px" }
    : { width: "100%", aspectRatio: "1/1", position: "relative", overflow: "hidden", borderRadius: "4px" };
  if (src && src.trim() !== "") {
    return (
      <div style={containerStyle} className="wholesale-media-container">
        <Image
          src={src}
          alt={alt}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
        />
      </div>
    );
  }
  return (
    <div style={{ ...containerStyle, background: "var(--surface)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center" }} className="wholesale-media-fallback">
      <Image
        src="/layrd-swirl.png"
        alt="LÄYRD Logo Fallback"
        width={80}
        height={80}
        style={{ opacity: 0.05 }}
      />
    </div>
  );
}