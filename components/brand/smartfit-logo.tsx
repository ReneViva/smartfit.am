export const SMARTFIT_LOGO_PATH = "/logo/Logo.svg";

type SmartfitLogoProps = {
  className?: string;
};

export function SmartfitLogo({ className = "" }: SmartfitLogoProps) {
  return (
    <img
      alt="Smartfit.am"
      className={className}
      src={SMARTFIT_LOGO_PATH}
    />
  );
}
