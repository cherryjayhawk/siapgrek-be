import { Poppins } from "next/font/google";
import localFont from "next/font/local";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const momoTrust = localFont({
  src: "../fonts/MomoTrustDisplay-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-momo",
});
