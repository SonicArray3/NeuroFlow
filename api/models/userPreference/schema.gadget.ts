import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "userPreference" model, go to https://neuroflows.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "wjrM6PbjXk91",
  comment:
    "Stores personalized settings for each user, controlling their experience and preferences within the application.",
  fields: {
    distractionMonitoringEnabled: {
      type: "boolean",
      default: true,
      validations: { required: true },
      storageKey: "5um5tqkn96TJ",
    },
    focusMusicEnabled: {
      type: "boolean",
      default: true,
      validations: { required: true },
      storageKey: "JGpFlOtKMCvs",
    },
    gamificationEnabled: {
      type: "boolean",
      default: true,
      validations: { required: true },
      storageKey: "J1l7wr_Lyd4N",
    },
    notificationsEnabled: {
      type: "boolean",
      default: true,
      validations: { required: true },
      storageKey: "Y2uMJ7SY8dLc",
    },
    preferredMusicType: {
      type: "string",
      storageKey: "1qsOMHDsIO3I",
    },
    studyReminderFrequency: {
      type: "enum",
      default: "Medium",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["Off", "Low", "Medium", "High"],
      validations: { required: true },
      storageKey: "nTUvGo6zyrZM",
    },
    theme: {
      type: "enum",
      default: "Light",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["Light", "Dark", "Zen", "Focus", "Cyberpunk"],
      validations: { required: true },
      storageKey: "AMWrEQrCTdN_",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "QGqdTpomfN6e",
    },
  },
};
