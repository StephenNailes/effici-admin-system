import { router } from '@inertiajs/react';
import { getCsrfMetaToken } from '@/lib/csrf';

export function useActivityPlanIO(planId?: number) {
  const post = (url: string, data: Record<string, any>, onSuccess?: () => void, onError?: (e:any)=>void) => {
    const token = getCsrfMetaToken();
    router.post(url, { ...data, _token: token }, {
      headers: token ? { 'X-CSRF-TOKEN': token } : undefined,
      preserveScroll: true,
      onSuccess,
      onError,
    });
  };

  const saveDraft = (html: string) => {
    if (!planId) throw new Error('Missing plan id');
    return post(`/student/requests/activity-plan/${planId}/save-draft`, { html });
  };

  // PDF generation removed

  const submit = () => {
    if (!planId) throw new Error('Missing plan id');
    return post(`/student/requests/activity-plan/${planId}/submit`, {});
  };

  return { saveDraft, submit };
}
