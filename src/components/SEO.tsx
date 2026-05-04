import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "AI Civil Engineering Platform Bangladesh";
const DEFAULT_DESC =
  "Upload house designs and get full construction estimate, BNBC structural analysis, BOQ, 3D model, and AI engineering suggestions instantly.";
const DEFAULT_IMAGE = "/placeholder.svg";

const SEO = ({ title, description, image, url, type = "website" }: SEOProps) => {
  const fullTitle = title ? `${title} | AI Civil Engineering BD` : DEFAULT_TITLE;
  const desc = (description || DEFAULT_DESC).slice(0, 160);
  const img = image || DEFAULT_IMAGE;
  const canonical = url || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
};

export default SEO;
