import { apiService } from "./api";
import type { AgencyMemberStats } from "./api";

export const marketerAgencyApi = apiService.injectEndpoints({
  endpoints: (builder) => ({
    createAgencyMember: builder.mutation<
      { member: AgencyMemberStats },
      { agencyId: number; member: { full_name: string; email: string; phone_number?: string } }
    >({
      query: ({ agencyId, member }) => ({
        url: `/api/v1/admin/marketers/${agencyId}/agency_members`,
        method: "POST",
        body: { member },
      }),
      invalidatesTags: ["Marketer" as any],
    }),
    allocateAgencyFunds: builder.mutation<
      { allocation: Record<string, unknown> },
      { agencyId: number; member_id: number; amount: number; wallet_type: string; notes?: string }
    >({
      query: ({ agencyId, ...body }) => ({
        url: `/api/v1/admin/marketers/${agencyId}/allocate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Marketer" as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateAgencyMemberMutation,
  useAllocateAgencyFundsMutation,
} = marketerAgencyApi;
