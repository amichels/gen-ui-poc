import { camelize, h, toHandlerKey, type Component, type Slots } from "vue";
import type { StateStore } from "@json-render/core";
import {
  useBoundProp,
  type Actions,
  type Components,
  type EventHandle,
} from "@json-render/vue";
import type { AppCatalog } from "./catalog";
import { shadcnComponents, shadcnComponentNames } from "./shadcn";

type FetchDataParams = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  statePath?: string;
  loadingPath?: string;
  errorPath?: string;
  successPath?: string;
  jsonPath?: string;
};

export const createActions = (store: StateStore) => {
  const fetchData = async (rawParams?: Record<string, unknown>) => {
    const params = rawParams as FetchDataParams | undefined;
    if (!params?.url) throw new Error("fetchData requires a url");

    const { url, method = "GET", headers, body, statePath, loadingPath, errorPath, successPath, jsonPath } = params;
    if (loadingPath) store.set(loadingPath, true);
    if (errorPath) store.set(errorPath, null);
    if (successPath) store.set(successPath, false);

    try {
      const response = await fetch(url, {
        method,
        headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await response.json() : await response.text();
      if (statePath) store.set(statePath, data);
      if (jsonPath) store.set(jsonPath, JSON.stringify(data, null, 2));
      if (successPath) store.set(successPath, true);
      return data;
    } catch (error) {
      if (errorPath) {
        store.set(errorPath, error instanceof Error ? error.message : String(error));
      }
      throw error;
    } finally {
      if (loadingPath) store.set(loadingPath, false);
    }
  };

  return { fetchData } satisfies Actions<AppCatalog>;
};

// Events that can be bound to actions via an element's `on` map.
const forwardedEvents = [
  "click",
  "change",
  "input",
  "select",
  "value-change",
  "update:modelValue",
  "update:open",
  "update:page",
  "submit",
];

export const createComponents = (_store: StateStore): Components<AppCatalog> =>
  Object.fromEntries(
    shadcnComponentNames.map((name) => [
      name,
      ({
        props,
        slots,
        bindings,
        on,
      }: {
        props: Record<string, unknown>;
        slots: Slots;
        bindings?: Record<string, string>;
        on: (event: string) => EventHandle;
      }) => {
        const boundProps: Record<string, unknown> = { ...props };
        const updateHandlers: Record<string, (value: unknown) => void> = {};
        const eventHandlers: Record<string, () => void> = {};

        for (const event of forwardedEvents) {
          const handle = on(event);
          if (!handle.bound) continue;
          const key = toHandlerKey(camelize(event));
          if (event === "submit" || handle.shouldPreventDefault) {
            eventHandlers[key] = (domEvent: Event) => {
              domEvent.preventDefault();
              handle.emit();
            };
          } else {
            eventHandlers[key] = handle.emit;
          }
        }

        // `on.enter` fires only when the user presses Enter.
        const enter = on("enter");
        if (enter.bound) {
          eventHandlers.onKeydown = (event: KeyboardEvent) => {
            if (event.key === "Enter") enter.emit();
          };
        }

        const mount = on("mount");
        if (mount.bound) eventHandlers.onVnodeMounted = mount.emit;

        for (const [propName, bindingPath] of Object.entries(bindings ?? {})) {
          const [value, setValue] = useBoundProp(props[propName], bindingPath);
          boundProps[propName] = value;
          updateHandlers[`onUpdate:${propName}`] = setValue;
        }

        const handlers: Record<string, unknown> = { ...eventHandlers };
        for (const [key, update] of Object.entries(updateHandlers)) {
          const emitEvent = eventHandlers[key];
          handlers[key] = emitEvent
            ? (value: unknown) => {
                update(value);
                emitEvent();
              }
            : update;
        }

        return h(shadcnComponents[name] as Component, { ...boundProps, ...handlers }, slots);
      },
    ]),
  ) as unknown as Components<AppCatalog>;
