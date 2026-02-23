import { createFeatureSelector, createSelector } from "@ngrx/store";
import { UserState } from "../../interfaces/api/user.interface";

export const selectAuth = createFeatureSelector<Readonly<UserState>>("auth");
export const selectPreAuth =
  createFeatureSelector<Readonly<UserState>>("pre_auth");

export const selectErrorMessage = createSelector(
  selectAuth,
  (state) => state.message
);

export const selectUserId = createSelector(
  selectAuth,
  (state) => state.user?.id
);

export const selectLoading = createSelector(
  selectAuth,
  (state) => state.loading
);

export const selectUser = createSelector(selectAuth, (state) => state.user);
