import { useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/components/shared/ui/use-toast'

interface AutoSaveOptions {
  onSave: (data: any) => Promise<void>
  delay?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Facebook-style auto-save hook
 * - Debounces save calls
 * - Retries on failure (up to 3 times)
 * - Provides save status
 */
export function useAutoSave({ onSave, delay = 1000, onSuccess, onError }: AutoSaveOptions) {
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const saveQueueRef = useRef<any>(null)
  const isSavingRef = useRef(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const executeSave = useCallback(async (data: any) => {
    if (isSavingRef.current) {
      console.log('⏳ Save already in progress, queuing...')
      saveQueueRef.current = data
      return
    }

    try {
      isSavingRef.current = true
      console.log('💾 Auto-saving:', data)

      await onSave(data)

      retryCountRef.current = 0
      console.log('✅ Auto-save successful')

      onSuccess?.()

      // Check if there's queued data
      if (saveQueueRef.current) {
        const queuedData = saveQueueRef.current
        saveQueueRef.current = null
        setTimeout(() => executeSave(queuedData), 100)
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error)

      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`🔄 Retrying save (${retryCountRef.current}/${maxRetries})...`)
        setTimeout(() => executeSave(data), 2000 * retryCountRef.current)
      } else {
        retryCountRef.current = 0
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        toast({
          title: 'Failed to save',
          description: `${errorMessage}. Your changes are saved locally and will retry.`,
          variant: 'destructive',
        })

        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    } finally {
      isSavingRef.current = false
    }
  }, [onSave, onSuccess, onError, toast])

  const triggerSave = useCallback((data: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      executeSave(data)
    }, delay)
  }, [delay, executeSave])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    triggerSave,
    isSaving: isSavingRef.current,
  }
}
