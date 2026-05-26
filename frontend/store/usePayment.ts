"use client";

import { create } from "zustand";
import toast from "react-hot-toast";

import { axiosInstance } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "./useAuth";

type Plan = {
  id: string;
  name: string;
  description: string;
  features: string;
  price: number;
  durationDays: number;
};

type Subscription = {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "canceled" | "pending";
};

type Payment = {
  id: string;
  subscriptionId: string;
  amount: number;
  forMonth: number;
  forYear: number;
  date: string;
  status: "pending" | "failed" | "succeeded";
};

type PlanStore = {
  plans: Plan[];
  subscriptions: Subscription[];
  activeSubscription: Subscription | null;
  payments: Payment[];
  currentPayment: Payment | null;

  totalRevenue: number;
  activeSubscriptionsCount: number;

  loading: boolean;

  fetchPlans: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  fetchActiveSubscription: () => Promise<void>;
  fetchPayments: () => Promise<void>;

  fetchTotalRevenue: () => Promise<void>;
  fetchActiveSubscriptionsCount: () => Promise<void>;

  createPlan: (data: {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    features: string;
  }) => Promise<boolean>;

  fetchPaymentById: (
    paymentId: string
  ) => Promise<Payment | null>;

  subscribeToPlan: (
    planId: string
  ) => Promise<any>;

  payForSubscription: (
    paymentId: string
  ) => Promise<boolean>;

  cancelSubscription: (
    subscriptionId: string
  ) => Promise<boolean>;
};

export const usePlanStore = create<PlanStore>(
  (set, get) => ({
    plans: [],
    subscriptions: [],
    activeSubscription: null,
    payments: [],
    currentPayment: null,

    totalRevenue: 0,
    activeSubscriptionsCount: 0,

    loading: false,

    fetchPlans: async () => {
      set({ loading: true });

      try {
        const data = await queryClient.fetchQuery({
          queryKey: ["plans"],
          queryFn: async () => {
            const res = await axiosInstance.get(
              "/plans"
            );

            return res.data;
          },
        });

        set({
          plans: data,
        });
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch plans"
        );
      } finally {
        set({ loading: false });
      }
    },

    createPlan: async (planData) => {
      set({ loading: true });

      try {
        const res = await axiosInstance.post(
          "/plans",
          planData
        );

        const newPlan = res.data;

        set({
          plans: [...get().plans, newPlan],
        });

        queryClient.invalidateQueries({
          queryKey: ["plans"],
        });

        toast.success("Plan created");

        return true;
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to create plan"
        );

        return false;
      } finally {
        set({ loading: false });
      }
    },

    fetchPaymentById: async (
      paymentId
    ) => {
      set({ loading: true });

      try {
        const data =
          await queryClient.fetchQuery({
            queryKey: [
              "payment",
              paymentId,
            ],

            queryFn: async () => {
              const res =
                await axiosInstance.get(
                  `/plans/payments/${paymentId}`
                );

              return res.data;
            },
          });

        set({
          currentPayment: data,
        });

        return data;
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch payment"
        );

        set({
          currentPayment: null,
        });

        return null;
      } finally {
        set({ loading: false });
      }
    },

    fetchSubscriptions: async () => {
      set({ loading: true });

      try {
        const data =
          await queryClient.fetchQuery({
            queryKey: ["subscriptions"],

            queryFn: async () => {
              const res =
                await axiosInstance.get(
                  "/plans/user"
                );

              return res.data;
            },
          });

        set({
          subscriptions: data,
        });
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch subscriptions"
        );
      } finally {
        set({ loading: false });
      }
    },

    fetchActiveSubscription:
      async () => {
        set({ loading: true });

        try {
          const data =
            await queryClient.fetchQuery({
              queryKey: [
                "active-subscription",
              ],

              queryFn: async () => {
                const res =
                  await axiosInstance.get(
                    "/plans/active"
                  );

                return res.data;
              },
            });

          set({
            activeSubscription: data,
          });
        } catch {
          set({
            activeSubscription: null,
          });
        } finally {
          set({ loading: false });
        }
      },

    fetchPayments: async () => {
      set({ loading: true });

      try {
        const data =
          await queryClient.fetchQuery({
            queryKey: ["payments"],

            queryFn: async () => {
              const res =
                await axiosInstance.get(
                  "/plans/payments"
                );

              return res.data;
            },
          });

        set({
          payments: data,
        });
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch payments"
        );
      } finally {
        set({ loading: false });
      }
    },

    fetchTotalRevenue: async () => {
      try {
        const res =
          await axiosInstance.get(
            "/plans/revenue"
          );

        set({
          totalRevenue:
            res.data.totalRevenue || 0,
        });
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch revenue"
        );
      }
    },

    fetchActiveSubscriptionsCount:
      async () => {
        try {
          const res =
            await axiosInstance.get(
              "/plans/report"
            );

          set({
            activeSubscriptionsCount:
              res.data.activeSubscriptions ||
              0,
          });
        } catch (error: any) {
          toast.error(
            error?.response?.data?.message ||
              "Failed to fetch report"
          );
        }
      },

    subscribeToPlan: async (
      planId
    ) => {
      set({ loading: true });

      try {
        const res =
          await axiosInstance.post(
            `/plans/subscribe/${planId}`
          );

        const data = res.data;

        set({
          activeSubscription:
            data.subscription,
        });

        queryClient.setQueryData(
          ["active-subscription"],
          data.subscription
        );

        queryClient.invalidateQueries({
          queryKey: ["subscriptions"],
        });

        return {
          success: true,
          paymentId:
            data.payment?.id,
        };
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to subscribe"
        );

        return {
          success: false,
          paymentId: null,
        };
      } finally {
        set({ loading: false });
      }
    },

    payForSubscription: async (
      paymentId
    ) => {
      set({ loading: true });

      try {
        const res =
          await axiosInstance.post(
            `/plans/pay/${paymentId}`
          );

        const data = res.data;

        set({
          activeSubscription:
            data.subscription,
        });

        queryClient.setQueryData(
          ["active-subscription"],
          data.subscription
        );

        queryClient.invalidateQueries({
          queryKey: ["subscriptions"],
        });

        queryClient.invalidateQueries({
          queryKey: ["payments"],
        });

        toast.success(
          "Payment successful"
        );

        useAuthStore.getState().checkAuth();


        return true;
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Payment failed"
        );

        return false;
      } finally {
        set({ loading: false });
      }
    },

    cancelSubscription: async (
      subscriptionId
    ) => {
      set({ loading: true });

      try {
        await axiosInstance.delete(
          `/plans/cancel/${subscriptionId}`
        );

        set({
          activeSubscription: null,
        });

        queryClient.setQueryData(
          ["active-subscription"],
          null
        );

        queryClient.invalidateQueries({
          queryKey: ["subscriptions"],
        });

        toast.success(
          "Subscription canceled"
        );
        useAuthStore.getState().checkAuth();

        return true;
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to cancel subscription"
        );

        return false;
      } finally {
        set({ loading: false });
      }
    },
  })
);