import type { Metadata } from "next";
import { TrackingPageClient } from "./TrackingPageClient";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function TrackingPage(props: Props) {
  const params = await props.params;
  return <TrackingPageClient token={params.token} />;
}

// Metadata
export async function generateMetadata(props: Props): Promise<Metadata> {
  return {
    title: "Seguimiento de Pedido | Follow It",
    description: "Sigue tu pedido en tiempo real",
  };
}
