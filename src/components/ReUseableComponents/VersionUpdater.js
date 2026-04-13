import { useEffect } from "react";
import { gt, valid, coerce } from "semver";

const VersionUpdater = () => {
  useEffect(() => {
    const handleUpdate = async (version) => {
      try {
        // Prevent double execution
        if (sessionStorage.getItem("version_updating")) return;
        sessionStorage.setItem("version_updating", "true");

        // 1. Clear LocalStorage except version
        localStorage.clear();
        sessionStorage.clear();

        // 2. Clear Cookies
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });

        // 3. Clear Service Workers
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
          }
        }

        // 4. Clear Caches
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((name) => caches.delete(name)));
        }

      } catch (error) {
        console.error("Error during version update cleanup:", error);
      } finally {
        // Store clean semver only
        localStorage.setItem("app_version", version);
        window.location.reload();
      }
    };

    const checkVersion = () => {
      const rawCurrent = process.env.NEXT_PUBLIC_WEB_VERSION;
      if (!rawCurrent) return;

      // Extract valid semver (handles "4.6.0 - New")
      const currentVersion = valid(rawCurrent) || coerce(rawCurrent)?.version;
      const storedRaw = localStorage.getItem("app_version");
      const storedVersion =
        valid(storedRaw) || coerce(storedRaw)?.version;

      if (!currentVersion) {
        console.warn("Invalid current version format:", rawCurrent);
        return;
      }

      if (storedVersion) {
        if (!valid(storedVersion)) {
          handleUpdate(currentVersion);
          return;
        }

        if (gt(currentVersion, storedVersion)) {
          handleUpdate(currentVersion);
        }
      } else {
        localStorage.setItem("app_version", currentVersion);
      }
    };

    checkVersion();
  }, []);

  return null;
};

export default VersionUpdater;
