import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "studyMaterial" model, go to https://neuroflows.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "3tJQulDMzXOu",
  comment:
    "Represents a study material uploaded by a user, such as a textbook or PDF.",
  fields: {
    description: { type: "string", storageKey: "1XC2ob3exMER" },
    file: {
      type: "file",
      allowPublicAccess: false,
      validations: { required: true },
      storageKey: "0kY8SrvZzaJ6",
    },
    fileType: { type: "string", storageKey: "_popccaF0KnL" },
    title: {
      type: "string",
      validations: { required: true },
      storageKey: "xGPgQTm2Xacc",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "14uP4F093d0A",
    },
  },
};
