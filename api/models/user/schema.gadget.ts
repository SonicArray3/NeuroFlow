import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://neuroflows.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "Yoe7X_wtCTrr",
  fields: {
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "0WhEyl-oRff6",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "9sYHlgQuyOOe",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "VSfUcD3NdXRi",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "K3-ICdSeRBoe",
    },
    firstName: { type: "string", storageKey: "u5oq8mtEAGo3" },
    googleImageUrl: { type: "url", storageKey: "iflApMt15yxR" },
    googleProfileId: { type: "string", storageKey: "ZuXJfLAcrrNR" },
    lastName: { type: "string", storageKey: "Wh-iR5tnV4xT" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "ZPHN9sE1TD0C",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "8tJMNizH7G0C",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "CiPOkdSy1hRn",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "KR1OSAEceC0K",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "iki0DQzVUgch",
    },
  },
};
