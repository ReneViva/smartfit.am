type ImageInputProps = {
  className?: string;
  defaultValue?: string;
  label: string;
  name: string;
  uploadName: string;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";

export function ImageInput({
  className = "",
  defaultValue = "",
  label,
  name,
  uploadName,
}: ImageInputProps) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="mt-2 grid gap-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
          Paste image URL
          <input
            className={inputClass}
            defaultValue={defaultValue}
            name={name}
            placeholder="https://..."
            type="url"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
          Or upload from device
          <input
            accept="image/*"
            className={inputClass}
            name={uploadName}
            type="file"
          />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        A selected file replaces the pasted URL. Maximum file size: 5 MB.
      </p>
    </fieldset>
  );
}
