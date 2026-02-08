// Re-export for backwards compatibility
import { createClient } from './supabase/client';

// Export as singleton for legacy code
export const supabase = createClient();
export { createClient };
