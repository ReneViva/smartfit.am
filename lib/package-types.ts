export const CUSTOM_PACKAGE_TYPE_VALUE = "__custom__";

export const PACKAGE_TYPE_PRESETS = [
  { label: "Gym Access", value: "GYM_ACCESS" },
  { label: "Swimming", value: "SWIMMING" },
  { label: "Cardio", value: "CARDIO" },
  { label: "Personal Training", value: "PERSONAL_TRAINING" },
  { label: "Group Training", value: "GROUP_TRAINING" },
  { label: "Swimming Trainer", value: "SWIMMING_TRAINER" },
  { label: "Fitness Trainer", value: "FITNESS_TRAINER" },
  { label: "Coach Sessions", value: "COACH_SESSIONS" },
  { label: "Other", value: "OTHER" },
] as const;

export function packageTypeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[-_]/g, " ")
    .replaceAll(/\s+/g, " ");
}

export function packageTypeLabel(value: string) {
  const trimmed = value.trim();
  const preset = PACKAGE_TYPE_PRESETS.find(
    (option) => packageTypeKey(option.value) === packageTypeKey(trimmed),
  );

  if (preset) {
    return preset.label;
  }

  const readable = trimmed.replaceAll(/[-_]/g, " ").replaceAll(/\s+/g, " ");

  if (readable && readable === readable.toUpperCase()) {
    return readable
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  return readable || "Other";
}
