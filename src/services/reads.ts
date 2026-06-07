import api from "./api.js";

export type Read = {
  slug: string;
  title: string;
  minutes: number;
  excerpt: string;
  body: string;
};

export async function fetchReads(): Promise<Read[]> {
  const data = await api.get<Read[] | string>("/assets/reads.json");
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function fetchRead(slug: string): Promise<Read | undefined> {
  const list = await fetchReads();
  return list.find((r) => r.slug === slug);
}
