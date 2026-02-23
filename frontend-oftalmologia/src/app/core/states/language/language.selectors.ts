import { createFeatureSelector, createSelector } from "@ngrx/store";
import { LanguageState } from "../../interfaces/ui/language.interface";

export const featuredSelector =
  createFeatureSelector<Readonly<LanguageState>>("language");

export const selectLanguage = createSelector(
  featuredSelector,
  (state) => state.code
);
