import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE = "https://civilosai.lovable.app";
const BRAND = "CivilOS AI";
const DEFAULT_TITLE = "CivilOS AI — Construction Cost Estimate & BNBC Analysis";
const DEFAULT_DESC =
  "Free AI construction cost estimate for Bangladesh. Upload a plan and get BOQ, BNBC 2022 load analysis, rebar design, rate analysis and a 3D model in minutes.";

const SEO = ({ title, description, image, url, path, type = "website", noindex, jsonLd }: SEOProps) => {
  const fullTitle = title ? `${title} | ${BRAND}` : DEFAULT_TITLE;
  const desc = (description || DEFAULT_DESC).slice(0, 160);
  const canonical =
    url ||
    (path ? `${SITE}${path}` : typeof window !== "undefined" ? `${SITE}${window.location.pathname}` : SITE);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export default SEO;
