import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { toast } from 'react-toastify'

type FlashProps = {
  flash?: {
    success?: string | null
    error?: string | null
  }
}

export default function FlashToaster() {
  const { props } = usePage<FlashProps>()
  const lastShownRef = useRef<string>('')

  useEffect(() => {
    const success = props.flash?.success
    const error = props.flash?.error

    // Build a key to avoid duplicate toasts on same page visit
    const key = `${success ?? ''}|${error ?? ''}`
    if (key === lastShownRef.current) return
    lastShownRef.current = key

    if (success) {
      toast.success(success, {
        toastId: `success-${success}`,
      })
    }
    if (error) {
      toast.error(error, {
        toastId: `error-${error}`,
      })
    }
  }, [props.flash?.success, props.flash?.error])

  return null
}
