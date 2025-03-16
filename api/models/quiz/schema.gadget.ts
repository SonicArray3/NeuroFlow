import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "quiz" model, go to https://neuroflows.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "_TTRz_OPix6F",
  comment:
    "A quiz generated from study materials, owned by a user and optionally associated with a specific study material.",
  fields: {
    bestScore: {
      type: "number",
      decimals: 2,
      storageKey: "TQDhk_CoUakA",
    },
    description: { type: "string", storageKey: "mOmTwPnDifor" },
    lastAttempt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "za-s2KjXI8BS",
    },
    questions: {
      type: "json",
      validations: { required: true },
      storageKey: "MyaLeTPb9LRD",
    },
    studyMaterial: {
      type: "belongsTo",
      parent: { model: "studyMaterial" },
      storageKey: "9xzxBTfZJNhd",
    },
    title: {
      type: "string",
      validations: { required: true },
      storageKey: "sw4kTLMh5gUY",
    },
    totalAttempts: {
      type: "number",
      decimals: 0,
      storageKey: "VBl9OMBHiBmZ",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "nTNo2CDt466J",
    },
  },
};
