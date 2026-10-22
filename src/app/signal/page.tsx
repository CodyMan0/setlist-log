import type { Metadata, Viewport } from "next";
import SignalApp from "../../components/signal/SignalApp";

export const metadata: Metadata = {
  title: "밴드 신호 · Conti Memory",
  description: "드럼에서 누르면 베이스 화면에 바로 뜨는 무대 신호",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function SignalPage() {
  return <SignalApp />;
}
