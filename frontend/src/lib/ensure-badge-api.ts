import { recordsApi } from "@/lib/api";
import { fetchIncomeBadge } from "@/lib/badge-api";

type RecordsApi = typeof recordsApi & {
  badge: (params?: { month?: string }) => ReturnType<typeof fetchIncomeBadge>;
};

(recordsApi as RecordsApi).badge = (params = {}) => fetchIncomeBadge(params.month);
