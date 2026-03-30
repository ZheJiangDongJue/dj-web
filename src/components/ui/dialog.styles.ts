export const DIALOG_OVERLAY_CLASSNAME_DEFAULT =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50'

export const DIALOG_CONTENT_CLASSNAME_DEFAULT =
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg'

export const DIALOG_CONTENT_CLASSNAME_FULLSCREEN =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none p-0 border-none bg-transparent shadow-none rounded-none duration-200'

