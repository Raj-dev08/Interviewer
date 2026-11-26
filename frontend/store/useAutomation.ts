
import { create } from "zustand";
import { axiosInstance } from "@/lib/api";
import toast from "react-hot-toast";

type BrowserStatus = "idle" | "opening" | "waiting_for_login" | "connected" | "closed" | "error";
export type SearchPreference = {
  role: string[];
  keywords: string[];
  locations: string[];
  remote: boolean;
  experience: string;
  employmentType: string[];
  excludedCompanies: string[];
};
type LinkedInProfile = { name?: string; headline?: string; profileUrl?: string; email?: string; location?: string; pictureUrl?: string };
type AutomationProfile = { userId?: string; email?: string; emailConnected?: boolean; searchPreference?: SearchPreference[]; linkdinProfile?: string | null; linkedinProfile?: LinkedInProfile | null; automationEnabled?: boolean; timezone?: string; browserSession?: { status?: BrowserStatus; userConfirmedLogin?: boolean; lastConnectedAt?: string | null; lastDisconnectedAt?: string | null; lastError?: string | null } };

type AutomationState = {
  profile: AutomationProfile | null;
  browserStatus: BrowserStatus;
  loading: boolean;
  connecting: boolean;
  savingPreferences: boolean;
  fetchAutomationData: () => Promise<void>;
  connectLinkedIn: () => Promise<boolean>;
  refreshBrowserStatus: () => Promise<void>;
  confirmLinkedInLogin: () => Promise<boolean>;
  closeBrowser: () => Promise<boolean>;
  updatePreferences: (preferences: Partial<AutomationProfile>) => Promise<boolean>;
};

export const useAutomationStore = create<AutomationState>((set, get) => ({
  profile: null,
  browserStatus: "idle",
  loading: false,
  connecting: false,
  savingPreferences: false,

  fetchAutomationData: async () => {
    set({ loading: true });

    try {
        const [profileRes, statusRes] = await Promise.all([
        axiosInstance.get("/automation/profile"),
        axiosInstance.get("/automation/linkedin/status"),
        ]);

        // Backend response: { success: true, data: profile }
        const profile = profileRes.data.data;

        // Backend response: { success: true, data: status }
        const browserStatus = statusRes.data.data.status || "idle";

        set({
        profile,
        browserStatus,
        });
    } catch (error: any) {
        toast.error(
        error.response?.data?.message ||
            "Failed to load automation data"
        );
    } finally {
        set({ loading: false });
    }
    },

  
  connectLinkedIn: async () => {
    set({ connecting: true, browserStatus: "opening" });
    try {
        const res = await axiosInstance.post("/automation/browser/open");
        set({ browserStatus: res.data.data.status || "waiting_for_login" });
        toast.success("Browser opened. Log in to LinkedIn.");
        return true;
    } catch (error: any) {
        set({ browserStatus: "error" });
        toast.error(error.response?.data?.message || "Failed to open browser");
        return false;
    } finally {
        set({ connecting: false });
    }
  },

  refreshBrowserStatus: async () => {
    try {
        const res = await axiosInstance.get("/automation/browser/status");
        set({ browserStatus: res.data.data.status || "idle" });
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to check status");
    }
  },

  confirmLinkedInLogin: async () => {
    set({ connecting: true });
    try {
        const res = await axiosInstance.post("/automation/browser/confirm");
        set({ browserStatus: res.data.data.status || "connected" });
        toast.success("LinkedIn account connected successfully");
        return true;
    } catch (error: any) {
        set({ browserStatus: error.response?.data?.status || "waiting_for_login" });
        toast.error(error.response?.data?.message || "LinkedIn login not detected");
        return false;
    } finally {
        set({ connecting: false });
    }
  },


  closeBrowser: async () => {
    try {
      await axiosInstance.post("/automation/browser/close");
      set({ browserStatus: "closed" });
      toast.success("Browser disconnected");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close browser");
      return false;
    }
  },

  updatePreferences: async (preferences) => {
    set({ savingPreferences: true });
    try {
      const res = await axiosInstance.patch("/automation/preferences", preferences);
      set({ profile: res.data });
      toast.success("Preferences saved");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save preferences");
      return false;
    } finally {
      set({ savingPreferences: false });
    }
  },
}));
