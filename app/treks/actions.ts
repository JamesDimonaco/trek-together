"use server";

import { revalidatePath } from "next/cache";

// Public trek pages are cached; call this after any edit so a trek that just
// went private or was deleted stops being served.
export async function revalidateTrekPage(trekId: string) {
  if (!/^[0-9a-z]{28,34}$/i.test(trekId)) return;
  revalidatePath(`/treks/${trekId}`);
}
