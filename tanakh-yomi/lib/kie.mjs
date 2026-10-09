// kie.ai jobs API: createTask + poll recordInfo. Key from KIE_API_KEY.
const KEY = process.env.KIE_API_KEY, BASE = "https://api.kie.ai/api/v1";
const call = async (path, init = {}) => {
  if (!KEY) throw new Error("KIE_API_KEY missing");
  const r = await fetch(BASE + path, { ...init, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" } });
  const j = await r.json(); if (j.code !== 200) throw new Error(`kie ${path}: ${j.code} ${j.msg}`); return j.data;
};
export const credits = () => call("/chat/credit");
export const kieTask = async (model, input, { timeoutMs = 600000 } = {}) => {
  const { taskId } = await call("/jobs/createTask", { method: "POST", body: JSON.stringify({ model, input }) });
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await new Promise((s) => setTimeout(s, 5000));
    const d = await call(`/jobs/recordInfo?taskId=${taskId}`);
    if (d.state === "success") return JSON.parse(d.resultJson);
    if (d.state === "fail") throw new Error(`kie task ${taskId} failed: ${d.failMsg ?? d.failCode}`);
  }
  throw new Error(`kie task ${taskId} timed out`);
};
