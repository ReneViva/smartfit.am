export const SMARTFIT_LOGO_LIGHT_PATH = "/logo/Logo.svg";
export const SMARTFIT_LOGO_DARK_PATH = "/logo/Logo_grey.svg";

type SmartfitLogoProps = {
  alt?: string;
  className?: string;
  darkSrc?: string;
  lightSrc?: string;
};

export function SmartfitLogo({
  alt = "Smartfit.am",
  className = "",
  darkSrc = SMARTFIT_LOGO_DARK_PATH,
  lightSrc = SMARTFIT_LOGO_LIGHT_PATH,
}: SmartfitLogoProps) {
  return (
    <>
      <img
        alt={alt}
        className={`${className} smartfit-logo-light`}
        src={lightSrc}
      />
      <img
        alt={alt}
        className={`${className} smartfit-logo-dark`}
        src={darkSrc}
      />
    </>
  );
}
