import {
  createGeneralNoteAction,
  deleteGeneralNoteAction,
  updateGeneralNoteAction,
} from "../../app/registration/notes/actions";
import { staffDisplayName } from "../../lib/notes-overview";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type GeneralNote = {
  content: string;
  createdAt: Date;
  createdBy: { name: string | null; username: string | null };
  id: string;
  updatedAt: Date;
  updatedBy: { name: string | null; username: string | null } | null;
};

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function GeneralNotesSection({
  notes,
  returnPath,
}: {
  notes: GeneralNote[];
  returnPath: "/admin/notes" | "/registration/notes";
}) {
  return (
    <section>
      <Card className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          General operational reminders
        </p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">General notes</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
          Notes here are not attached to a customer. They are visible to Admin
          and Registration staff.
        </p>
        <form action={createGeneralNoteAction} className="mt-5">
          <input name="returnPath" type="hidden" value={returnPath} />
          <label className="block text-sm font-semibold text-foreground">
            Quick general note
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
              maxLength={4000}
              name="content"
              placeholder="Add a general reception note, e.g. Make coffee or Call to clean the gym."
              required
            />
          </label>
          <div className="mt-3 flex justify-end">
            <Button className="w-full sm:w-auto" type="submit">
              Add general note
            </Button>
          </div>
        </form>
      </Card>

      {notes.length ? (
        <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto overscroll-contain pr-1">
          {notes.map((note) => (
            <Card className="p-5" key={note.id}>
              <p className="whitespace-pre-wrap break-words leading-7 text-foreground">
                {note.content}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-xs leading-5 text-secondary">
                <span>
                  Created by {staffDisplayName(note.createdBy)} on{" "}
                  {displayDateTime(note.createdAt)}
                </span>
                {note.updatedBy && note.updatedAt > note.createdAt ? (
                  <span>
                    Updated by {staffDisplayName(note.updatedBy)} on{" "}
                    {displayDateTime(note.updatedAt)}
                  </span>
                ) : null}
              </div>
              <details className="mt-4">
                <summary className="min-h-11 cursor-pointer rounded-lg bg-neutral px-3 py-2 text-sm font-semibold text-foreground hover:bg-neutral-hover">
                  Edit or delete note
                </summary>
                <form action={updateGeneralNoteAction} className="mt-3">
                  <input name="noteId" type="hidden" value={note.id} />
                  <input
                    name="updatedAt"
                    type="hidden"
                    value={note.updatedAt.toISOString()}
                  />
                  <input name="returnPath" type="hidden" value={returnPath} />
                  <label className="block text-sm font-semibold text-foreground">
                    Note content
                    <textarea
                      className="mt-2 min-h-24 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                      defaultValue={note.content}
                      maxLength={4000}
                      name="content"
                      required
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button type="submit">Save note</Button>
                  </div>
                </form>
                <form action={deleteGeneralNoteAction} className="mt-2">
                  <input name="noteId" type="hidden" value={note.id} />
                  <input
                    name="updatedAt"
                    type="hidden"
                    value={note.updatedAt.toISOString()}
                  />
                  <input name="returnPath" type="hidden" value={returnPath} />
                  <Button type="submit" variant="danger">
                    Delete note
                  </Button>
                </form>
              </details>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-secondary">
          No active general notes. Add a quick reminder above.
        </p>
      )}
    </section>
  );
}
