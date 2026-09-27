import { readSettings } from "../shared/storage";
import { getProviderByName } from "./providers";

type MessageRequest = {
  type: "clarify" | "hint";
  systemPrompt: string;
  userPrompt: string;
};

const runtime = chrome?.runtime;

if (runtime?.onMessage) {
  runtime.onMessage.addListener(
    (message: MessageRequest, _sender, sendResponse) => {
      if (!message || !message.type) {
        return;
      }

      void (async () => {
        try {
          const settings = await readSettings();
          const provider = getProviderByName(settings.provider);
          const response = await provider.sendPrompt(
            message.systemPrompt,
            message.userPrompt,
            settings.apiKey,
            settings.model,
          );
          sendResponse({ ok: true, response });
        } catch (error) {
          sendResponse({
            ok: false,
            response:
              error instanceof Error ? error.message : "The AI request failed.",
          });
        }
      })();

      return true;
    },
  );
}
