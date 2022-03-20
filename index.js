import { getAirgram, authUser } from "./src/functions.js";

const airgram = getAirgram();
authUser(airgram);

// 