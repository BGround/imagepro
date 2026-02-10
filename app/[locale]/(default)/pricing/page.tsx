import Pricing from "@/components/blocks/pricing";
import { generateSEOMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return generateSEOMetadata({
    title: t('seo.pricing.title'),
    description: t('seo.pricing.description'),
    keywords: t('seo.pricing.keywords'),
    locale,
    path: '/pricing',
    image: '/api/og?title=' + encodeURIComponent(t('seo.pricing.title')) + '&description=' + encodeURIComponent(t('seo.pricing.description')),
  });
}

export default async function PricingPage() {
  return <Pricing />;
}
