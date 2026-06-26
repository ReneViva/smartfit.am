import Script from "next/script";

type JsonLdProps = {
  data: Record<string, unknown>;
};

function jsonLdId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return `json-ld-${hash.toString(36)}`;
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: json,
      }}
      id={jsonLdId(json)}
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}
