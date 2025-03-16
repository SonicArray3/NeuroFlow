import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "flashcard" model, go to https://neuroflows.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "6AJOKvWJAHY1",
  comment:
    "The flashcard model represents a single flashcard created by a user, used for studying and reviewing specific information. It stores the question, answer, difficulty level, and review history, and can be associated with a specific study material.",
  fields: {
    answer: {
      type: "richText",
      validations: { required: true },
      storageKey: "ruPVTceQCpCi",
    },
    correctAnswers: {
      type: "number",
      default: 0,
      decimals: 0,
      storageKey: "wniAOKxWjyWC",
    },
    difficulty: {
      type: "number",
      default: 3,
      decimals: 0,
      validations: { numberRange: { min: 1, max: 5 } },
      storageKey: "nhiAuGQQiNvn",
    },
    incorrectAnswers: {
      type: "number",
      default: 0,
      decimals: 0,
      storageKey: "pzMeOtIaOnp5",
    },
    lastReviewed: {
      type: "dateTime",
      includeTime: true,
      storageKey: "qD32MG74fT7O",
    },
    nextReviewDate: {
      type: "dateTime",
      includeTime: true,
      storageKey: "WnPsHcjgzcxT",
    },
    question: {
      type: "richText",
      validations: { required: true },
      storageKey: "BfdjwPXBkxq2",
    },
    studyMaterial: {
      type: "belongsTo",
      parent: { model: "studyMaterial" },
      storageKey: "kroLr21YDbHp",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "WgoZYU73-Ki0",
    },
  },
};
