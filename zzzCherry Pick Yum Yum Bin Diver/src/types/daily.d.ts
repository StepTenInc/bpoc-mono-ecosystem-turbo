/**
 * Daily.co TypeScript Declarations
 * Extends the @daily-co/daily-js package types
 */

declare module '@daily-co/daily-js' {
  export interface DailyEventObjectParticipant {
    participant: {
      session_id: string;
      user_id?: string;
      user_name?: string;
      local: boolean;
      owner: boolean;
      audio: boolean;
      video: boolean;
      screen: boolean;
    };
  }

  export interface DailyCall {
    join: (options?: { url?: string; token?: string }) => Promise<any>;
    leave: () => Promise<void>;
    destroy: () => void;
    setLocalAudio: (enabled: boolean) => void;
    setLocalVideo: (enabled: boolean) => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    on: (event: string, callback: (event?: any) => void) => void;
    off: (event: string, callback?: (event?: any) => void) => void;
    participants: () => Record<string, any>;
    localAudio: () => boolean;
    localVideo: () => boolean;
    localScreenShare: () => boolean;
  }

  export interface DailyFactoryOptions {
    url?: string;
    token?: string;
    dailyConfig?: {
      experimentalChromeVideoMuteLightOff?: boolean;
    };
  }

  interface DailyIframeStatic {
    createCallObject: (options?: DailyFactoryOptions) => DailyCall;
    supportedBrowser: () => { supported: boolean; mobile: boolean; name: string };
  }

  const DailyIframe: DailyIframeStatic;
  export default DailyIframe;
}












