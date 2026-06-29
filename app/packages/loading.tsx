import { PublicRouteSkeleton } from "../../components/ui/loading-skeletons";

export default function PackagesLoading() {
  return (
    <PublicRouteSkeleton label="Loading packages" variant="catalog" />
  );
}
