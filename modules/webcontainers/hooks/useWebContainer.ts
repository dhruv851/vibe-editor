import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import type { TemplateFolder } from "./../../playground/lib/path-to-json";

/** ---- module-level singleton to prevent multiple boots ---- */
let wc: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getWebContainer(): Promise<WebContainer> {
  if (wc) return wc;
  if (!bootPromise) {
    bootPromise = WebContainer.boot()
      .then((inst) => {
        wc = inst;
        return inst;
      })
      .catch((e) => {
        // reset so a later attempt can retry
        bootPromise = null;
        throw e;
      });
  }
  return bootPromise;
}

async function teardownWebContainer() {
  try {
    await wc?.teardown();
  } finally {
    wc = null;
    bootPromise = null;
  }
}

/** ---- types ---- */
interface UseWebContainerProps {
  templateData: TemplateFolder | null; // kept for your API; not used here
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (p: string, content: string) => Promise<void>;
  destroy: () => Promise<void>;
}

/** ---- hook ---- */
export const useWebContainer = ({
  templateData, // eslint-disable-line @typescript-eslint/no-unused-vars
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const inst = await getWebContainer();
        if (!cancelled) setInstance(inst);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? "Failed to initialize WebContainer");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // Do NOT teardown here; StrictMode/HMR would thrash the single instance.
    return () => {
      cancelled = true;
    };
  }, []);

  const writeFileSync = useCallback(
    async (p: string, content: string) => {
      if (!instance) throw new Error("WebContainer instance is not available");

      const parts = p.split("/");
      const dir = parts.slice(0, -1).join("/");

      if (dir) {
        await instance.fs.mkdir(dir, { recursive: true });
      }
      await instance.fs.writeFile(p, content);
    },
    [instance]
  );

  const destroy = useCallback(async () => {
    await teardownWebContainer();
    setInstance(null);
    setServerUrl(null);
  }, []);

  return { serverUrl, isLoading, error, instance, writeFileSync, destroy };
};
