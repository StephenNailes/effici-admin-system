import { router } from '@inertiajs/react';
import { refreshCsrfToken } from '@/lib/csrf';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface SubmitOptions {
  preserveScroll?: boolean;
  preserveState?: boolean;
  onSuccess?: () => void;
  onError?: (errors: any) => void;
  onFinish?: () => void;
}

/**
 * Enhanced Inertia request that automatically handles CSRF token refresh
 * Prevents 419 "Page Expired" errors by refreshing the token before submission
 */
export function useInertiaSubmit() {
  const submit = async (
    method: Method,
    url: string,
    data?: any,
    options?: SubmitOptions
  ) => {
    // Refresh CSRF token before making the request
    await refreshCsrfToken();

    return new Promise<void>((resolve, reject) => {
      const requestOptions = {
        ...options,
        onError: async (errors: any) => {
          // Check if it's a CSRF error (419)
          const isCsrfError =
            errors?.__inertia_errors ||
            (typeof errors === 'object' && 
             Object.values(errors).some((err: any) => 
               typeof err === 'string' && (
                 err.includes('419') || 
                 err.includes('CSRF') || 
                 err.includes('expired')
               )
             ));

          if (isCsrfError) {
            console.log('CSRF error detected, refreshing token and retrying...');
            // Refresh token and retry once
            await refreshCsrfToken();
            
            router[method](url, data, {
              ...options,
              onSuccess: () => {
                resolve();
                options?.onSuccess?.();
              },
              onError: (retryErrors: any) => {
                reject(retryErrors);
                options?.onError?.(retryErrors);
              },
            });
          } else {
            reject(errors);
            options?.onError?.(errors);
          }
        },
        onSuccess: () => {
          resolve();
          options?.onSuccess?.();
        },
      };

      router[method](url, data, requestOptions);
    });
  };

  return { submit };
}
