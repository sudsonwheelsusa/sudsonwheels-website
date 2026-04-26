import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SudsOnWheels — Mobile Pressure Washing | Ashland, OH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1D3557",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            color: "#C8102E",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          SudsOnWheels
        </div>
        <div
          style={{
            color: "#FAF6F0",
            fontSize: 64,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Pressure Washing You Can Trust
        </div>
        <div
          style={{
            color: "#C8102E",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          Mobile Pressure Washing · Ashland, OH
        </div>
      </div>
    ),
    { ...size }
  );
}
