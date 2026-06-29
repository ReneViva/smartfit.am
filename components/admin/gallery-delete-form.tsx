"use client";

import { deleteGalleryImageAction } from "../../app/admin/gallery/actions";
import { Button } from "../ui/button";

export function GalleryDeleteForm({
  imageId,
  imageTitle,
}: {
  imageId: string;
  imageTitle: string;
}) {
  return (
    <form
      action={deleteGalleryImageAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Remove "${imageTitle}" from the gallery? This does not delete the remote image file.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={imageId} />
      <Button pendingLabel="Deleting..." type="submit" variant="danger">
        Delete
      </Button>
    </form>
  );
}
