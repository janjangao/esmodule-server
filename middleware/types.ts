import type { State, Context, Middleware } from "../deps.ts";

export type { State, Context, Middleware };

export interface MiddlewareClazz<S extends State> {
  disabled: boolean;

  do: Middleware<S>;
}
